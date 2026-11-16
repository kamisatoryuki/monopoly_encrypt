import assert from 'node:assert/strict';
import {
  buildChallengeForTrigger,
  createNewSession,
  getNextMixedStateOnSolve,
} from './gameEngine';
import {
  charToCode,
  codeToChar,
  createPairedChallenge,
  decryptNumbers,
  encryptText,
  evalCompositionGF,
  evalInverseGF,
  generateSessionMathKeys,
  getChallengeHints,
  parseCiphertextInput,
  validateDecryptSubmission,
  validateEncryptSubmission,
  validateSessionMathKeys,
} from './mathEngine';

function runMathEngineTests() {
  let passed = 0;

  // 1. Key generation constraints: a,c in 2..5 and b,d in 1..9, positive ciphertexts
  for (let i = 0; i < 100; i++) {
    const keys = generateSessionMathKeys();
    assert.equal(validateSessionMathKeys(keys), true, 'Keys must satisfy a,c in 2..5 and b,d in 1..9');
    for (let x = 0; x <= 26; x++) {
      const y = evalCompositionGF(x, keys);
      assert.ok(y > 0 && Number.isInteger(y), `Ciphertext for x=${x} must be positive integer`);
    }
  }
  passed++;

  // 2. Character mapping: 0 = space, A = 1 .. Z = 26
  assert.equal(charToCode(' '), 0);
  assert.equal(charToCode('A'), 1);
  assert.equal(charToCode('Z'), 26);
  assert.equal(codeToChar(0), ' ');
  assert.equal(codeToChar(1), 'A');
  assert.equal(codeToChar(26), 'Z');
  assert.throws(() => codeToChar(-1));
  assert.throws(() => codeToChar(27));
  assert.throws(() => codeToChar(1.5));
  passed++;

  // 3. Multi-word encryption & decryption round-trip preserving spaces without '/'
  const sampleKeys = { a: 3, b: 4, c: 2, d: 5 };
  // (g ∘ f)(x) = 2*(3x + 4) + 5 = 6x + 13
  // For ' ' (0) => 2*(4)+5 = 13
  const multiWord = 'KODE AMAN CRYPTO';
  const enc = encryptText(multiWord, sampleKeys);
  assert.equal(enc.normalizedPlaintext, 'KODE AMAN CRYPTO');
  assert.equal(enc.cipherText.includes('/'), false, 'Must never use slash / separator');
  assert.equal(enc.cipherText.includes(','), true, 'Must use comma separator');
  assert.equal(enc.plainCodes[4], 0, 'Space at index 4 must encode to 0');
  assert.equal(enc.cipherNumbers[4], 13, 'Space x=0 must encrypt via g(f(0))');

  const dec = decryptNumbers(enc.cipherNumbers, sampleKeys);
  assert.equal(dec.valid, true);
  assert.equal(dec.plaintext, 'KODE AMAN CRYPTO', 'Decryption must restore spaces from 0');
  assert.equal(dec.plainCodes[4], 0);
  passed++;

  // 4. Reject slash separator and invalid ciphertext numbers
  const slashRes = parseCiphertextInput('79, 103 / 19, 91');
  assert.equal(slashRes.valid, false);
  assert.ok(slashRes.error?.includes('slash'), 'Slash must be explicitly rejected');

  // Out of 0..26 range check: x = 27 => y = 6*27 + 13 = 175
  const outOfRangeInv = evalInverseGF(175, sampleKeys);
  assert.equal(outOfRangeInv.valid, false, 'Decryption > 26 must fail validation');

  const outOfRangeDec = decryptNumbers([175], sampleKeys);
  assert.equal(outOfRangeDec.valid, false);
  passed++;

  // 5. Exhaustive bijection across x = 0..26 for all valid parameter combinations
  for (let a = 2; a <= 5; a++) {
    for (let c = 2; c <= 5; c++) {
      for (let b = 1; b <= 9; b += 4) {
        for (let d = 1; d <= 9; d += 4) {
          const keys = { a, b, c, d };
          for (let x = 0; x <= 26; x++) {
            const y = evalCompositionGF(x, keys);
            const inv = evalInverseGF(y, keys);
            assert.equal(inv.valid, true);
            assert.equal(inv.fInv, x, `Inverse must recover exact x=${x}`);
          }
        }
      }
    }
  }
  passed++;

  // 6. Challenge validation & non-leaking 3-tier hints
  const challenge = createPairedChallenge({
    id: 'test-pair',
    trigger: 'SPECIAL_TILE',
    title: 'Uji Pasangan',
    contextNote: 'Test',
    rawPlaintext: 'GERBANG DUA',
    keys: sampleKeys,
    rewardCredits: 100,
  });

  const encHints = getChallengeHints('ENCRYPT', challenge, sampleKeys);
  assert.equal(encHints.length, 3);
  for (const hint of encHints) {
    assert.equal(hint.includes(challenge.cipherText), false, 'Encrypt hint must never leak full ciphertext');
  }

  const decHints = getChallengeHints('DECRYPT', challenge, sampleKeys);
  assert.equal(decHints.length, 3);
  for (const hint of decHints) {
    assert.equal(hint.includes('GERBANG DUA'), false, 'Decrypt hint must never leak plaintext answer');
  }

  const wrongSpaceDecrypt = validateDecryptSubmission('GERBANGDUA', challenge);
  assert.equal(wrongSpaceDecrypt.isValid, false, 'Missing space must be rejected');

  const validEncrypt = validateEncryptSubmission(challenge.cipherText, challenge);
  assert.equal(validEncrypt.isValid, true);

  const validDecrypt = validateDecryptSubmission('gerbang dua', challenge);
  assert.equal(validDecrypt.isValid, true);
  passed++;

  // 7. Challenge Type Selection: Encryption Only, Decryption Only, Mixed (alternating + reusing ciphertext)
  for (const mode of ['classic', 'solo'] as const) {
    const encOnlySession = createNewSession({
      mode,
      challengeType: 'encryption',
      playerNames: ['P1', 'P2'],
    });
    assert.equal(encOnlySession.challengeType, 'encryption');
    let curEnc = encOnlySession;
    for (let stepIdx = 0; stepIdx < 4; stepIdx++) {
      const built = buildChallengeForTrigger({
        session: curEnc,
        trigger: 'SPECIAL_TILE',
      });
      assert.equal(built.challenge.currentStep, 'ENCRYPT', 'Encryption Only must always generate ENCRYPT');
      const nextMixed = getNextMixedStateOnSolve({
        ...curEnc,
        activeChallenge: built.challenge,
      });
      curEnc = {
        ...curEnc,
        usedPhraseIndices: built.nextUsedIndices,
        mixedNextStep: nextMixed.mixedNextStep,
        pendingMixedCipher: nextMixed.pendingMixedCipher,
      };
    }

    const decOnlySession = createNewSession({
      mode,
      challengeType: 'decryption',
      playerNames: ['P1', 'P2'],
    });
    assert.equal(decOnlySession.challengeType, 'decryption');
    let curDec = decOnlySession;
    for (let stepIdx = 0; stepIdx < 4; stepIdx++) {
      const built = buildChallengeForTrigger({
        session: curDec,
        trigger: 'BUY_PROPERTY',
      });
      assert.equal(built.challenge.currentStep, 'DECRYPT', 'Decryption Only must always generate DECRYPT');
      const nextMixed = getNextMixedStateOnSolve({
        ...curDec,
        activeChallenge: built.challenge,
      });
      curDec = {
        ...curDec,
        usedPhraseIndices: built.nextUsedIndices,
        mixedNextStep: nextMixed.mixedNextStep,
        pendingMixedCipher: nextMixed.pendingMixedCipher,
      };
    }

    // Mixed: ENCRYPT -> DECRYPT (same ciphertext) -> ENCRYPT -> DECRYPT (same ciphertext)
    let curMixed = createNewSession({
      mode,
      challengeType: 'mixed',
      playerNames: ['P1', 'P2'],
    });
    assert.equal(curMixed.challengeType, 'mixed');
    assert.equal(curMixed.mixedNextStep, 'ENCRYPT');

    const c1 = buildChallengeForTrigger({ session: curMixed, trigger: 'BUY_PROPERTY' });
    assert.equal(c1.challenge.currentStep, 'ENCRYPT');
    const afterC1 = getNextMixedStateOnSolve({ ...curMixed, activeChallenge: c1.challenge });
    assert.equal(afterC1.mixedNextStep, 'DECRYPT');
    assert.equal(afterC1.pendingMixedCipher?.cipherText, c1.challenge.cipherText);
    curMixed = {
      ...curMixed,
      usedPhraseIndices: c1.nextUsedIndices,
      mixedNextStep: afterC1.mixedNextStep,
      pendingMixedCipher: afterC1.pendingMixedCipher,
    };

    const c2 = buildChallengeForTrigger({ session: curMixed, trigger: 'SPECIAL_CARD' });
    assert.equal(c2.challenge.currentStep, 'DECRYPT');
    assert.equal(c2.challenge.fromPreviousMixedEncrypt, true);
    assert.equal(c2.challenge.cipherText, c1.challenge.cipherText, 'Mixed DECRYPT must reuse previous ENCRYPT ciphertext');
    assert.equal(c2.challenge.plaintext, c1.challenge.plaintext, 'Mixed DECRYPT must recover exact plaintext of previous ENCRYPT');
    const afterC2 = getNextMixedStateOnSolve({ ...curMixed, activeChallenge: c2.challenge });
    assert.equal(afterC2.mixedNextStep, 'ENCRYPT');
    assert.equal(afterC2.pendingMixedCipher, null);
    curMixed = {
      ...curMixed,
      usedPhraseIndices: c2.nextUsedIndices,
      mixedNextStep: afterC2.mixedNextStep,
      pendingMixedCipher: afterC2.pendingMixedCipher,
    };

    const c3 = buildChallengeForTrigger({ session: curMixed, trigger: 'SPECIAL_TILE' });
    assert.equal(c3.challenge.currentStep, 'ENCRYPT');
    const afterC3 = getNextMixedStateOnSolve({ ...curMixed, activeChallenge: c3.challenge });
    curMixed = {
      ...curMixed,
      usedPhraseIndices: c3.nextUsedIndices,
      mixedNextStep: afterC3.mixedNextStep,
      pendingMixedCipher: afterC3.pendingMixedCipher,
    };

    const c4 = buildChallengeForTrigger({ session: curMixed, trigger: 'JAIL_ESCAPE' });
    assert.equal(c4.challenge.currentStep, 'DECRYPT');
    assert.equal(c4.challenge.fromPreviousMixedEncrypt, true);
    assert.equal(c4.challenge.cipherText, c3.challenge.cipherText);
  }
  passed++;

  console.log(`PASS: ${passed}/${passed} mathematical engine & challenge type test suites passed.`);
}

runMathEngineTests();

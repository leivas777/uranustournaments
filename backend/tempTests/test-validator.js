// backend/test-validator-fixed.js
const { validateBrazilianAddress, sanitizeAddress, validateBrazilianZipCode } = require('../validators/addressValidator');

console.log('🧪 Testando validadores corrigidos...\n');

// Teste CEP válido
console.log('📍 Teste CEP válido:');
console.log('CEP "01234-567":', validateBrazilianZipCode('01234-567'));
console.log('CEP "01234567":', validateBrazilianZipCode('01234567'));

// Teste CEP inválido
console.log('\n📍 Teste CEP inválido:');
console.log('CEP "123":', validateBrazilianZipCode('123'));
console.log('CEP "00000000":', validateBrazilianZipCode('00000000'));

// Teste endereço completo válido
const validAddress = {
  street: 'Rua das Flores',
  number: '123',
  neighborhood: 'Centro',
  city: 'São Paulo',
  state: 'SP',
  zipCode: '01234-567'
};

console.log('\n✅ Teste endereço válido:');
const validResult = validateBrazilianAddress(validAddress);
console.log('Validação:', validResult);

console.log('\n🧹 Endereço sanitizado:');
const sanitized = sanitizeAddress(validAddress);
console.log('Original:', validAddress);
console.log('Sanitizado:', sanitized);

// Teste endereço com problemas de formatação
const messyAddress = {
  street: '  RUA DAS   FLORES  ',
  number: ' 123A ',
  neighborhood: 'centro',
  city: 'são paulo',
  state: 'sp',
  zipCode: '01234567'
};

console.log('\n🧹 Teste sanitização de endereço bagunçado:');
console.log('Original:', messyAddress);
console.log('Sanitizado:', sanitizeAddress(messyAddress));

// Teste endereço inválido
const invalidAddress = {
  street: '',
  number: '',
  neighborhood: 'a',
  city: 'b',
  state: 'XY',
  zipCode: '123'
};

console.log('\n❌ Teste endereço inválido:');
const invalidResult = validateBrazilianAddress(invalidAddress);
console.log('Validação:', invalidResult);
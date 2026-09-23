// Rwanda mobile number rules:
// MTN Mobile Money:   078 or 079 prefix
// Airtel Money:       072 or 073 prefix
// Full format: 07XXXXXXXX (10 digits total)

export function validatePhoneNumber(phone, method) {
  const cleaned = phone.replace(/\s+/g, '');

  if (!/^07\d{8}$/.test(cleaned)) {
    return 'Phone number must be in the format 07XXXXXXXX (10 digits)';
  }

  const prefix = cleaned.substring(0, 3);

  if (method === 'MTN Mobile Money' && !['078', '079'].includes(prefix)) {
    return 'MTN Mobile Money numbers must start with 078 or 079';
  }

  if (method === 'Airtel Money' && !['072', '073'].includes(prefix)) {
    return 'Airtel Money numbers must start with 072 or 073';
  }

  return null; // valid
}

export function validateAccountNumber(accountNumber) {
  const cleaned = accountNumber.replace(/\s+/g, '');
  if (!/^\d{8,16}$/.test(cleaned)) {
    return 'Account number must be 8–16 digits';
  }
  return null; // valid
}

export const RWANDA_BANKS = [
  'Bank of Kigali (BK)',
  'Equity Bank Rwanda',
  'I&M Bank Rwanda',
  'Access Bank Rwanda',
  'Cogebanque',
  'Ecobank Rwanda',
  'GT Bank Rwanda',
  'NCBA Bank Rwanda',
];
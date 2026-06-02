-- Remove hard-coded default description options from invoices and payment verifications.

DELETE FROM invoice_description_options
WHERE label IN (
  'TRAJNIMI per Cyber Security',
  'TRAJNIMI per Full Stack Development',
  'TRAJNIMI per Web Development'
);

DELETE FROM payment_verification_description_options
WHERE label IN (
  'TRAJNIMI per Cyber Security',
  'TRAJNIMI per Full Stack Development',
  'TRAJNIMI per Web Development'
);

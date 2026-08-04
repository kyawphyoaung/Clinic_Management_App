export function summarizeTreatment(treatment: {
  charges: { netPrice: { toString(): string } | number }[];
  payments: {
    amount: { toString(): string } | number;
    paymentDate: Date;
    id: string;
  }[];
}) {
  const totalCharges = treatment.charges.reduce(
    (sum, c) => sum + Number(c.netPrice),
    0
  );
  const totalPaid = treatment.payments.reduce(
    (sum, p) => sum + Number(p.amount),
    0
  );
  let running = totalCharges;
  const paymentsWithBalance = treatment.payments.map((p) => {
    running -= Number(p.amount);
    return {
      id: p.id,
      amount: Number(p.amount),
      paymentDate: p.paymentDate,
      balanceAfter: running,
    };
  });

  return {
    totalCharges,
    totalPaid,
    balance: totalCharges - totalPaid,
    paymentsWithBalance,
  };
}

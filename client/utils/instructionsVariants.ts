enum InstructionVariant {
  CreateWallet = 0,
  CreateTransaction,
  ConfirmTransaction,
  RejectTransaction,
  ExecuteTransaction,
  CancelTransaction,
}

export default InstructionVariant;

use solana_program::{
    account_info::{
        AccountInfo,
        next_account_info
    },
    borsh::try_from_slice_unchecked,
    entrypoint::ProgramResult,
    pubkey::Pubkey,
    program::invoke_signed,
    program_error::ProgramError,
    program_pack::IsInitialized,
    rent::Rent,
    sysvar::Sysvar,
    system_instruction,
    msg
};
use borsh::{
    BorshSerialize
};
use crate::instruction::{
    MultiSigWalletInstruction
};
use crate::state::{
    MultiSigWalletState
};
use crate::error::{
    MultiSigWalletError
};

pub struct Processor;
impl Processor {
    pub fn process(program_id: &Pubkey, accounts: &[AccountInfo], instruction_data: &[u8]) -> ProgramResult {
        let instruction = MultiSigWalletInstruction::unpack(instruction_data)?;
        match instruction {
            MultiSigWalletInstruction::CreateWallet { owners, threshold } => {
                msg!("Instruction: CreateWallet");
                Self::create_wallet(program_id, accounts, owners, threshold)
            },
            MultiSigWalletInstruction::CreateTransaction { variant, amount, owners, threshold } => {
                msg!("Instruction: CreateTransaction");
                Self::create_transaction(program_id, accounts, variant, amount, owners, threshold)
            },
            MultiSigWalletInstruction::ConfirmTransaction {} => {
                msg!("Instruction: ConfirmTransaction");
                Self::confirm_transaction(program_id, accounts)
            },
            MultiSigWalletInstruction::RejectTransaction {} => {
                msg!("Instruction: RejectTransaction");
                Self::reject_transaction(program_id, accounts)
            },
            MultiSigWalletInstruction::ExecuteTransaction {} => {
                msg!("Instruction: ExecuteTransaction");
                Self::execute_transaction(program_id, accounts)
            },
            MultiSigWalletInstruction::CancelTransaction {} => {
                msg!("Instruction: CancelTransaction");
                Self::cancel_transaction(program_id, accounts)
            },
        }
    }

    fn create_wallet(
        program_id: &Pubkey,
        accounts: &[AccountInfo],
        owners: Vec<Pubkey>,
        threshold: u64
    ) -> ProgramResult {
        if threshold < 2 || threshold > 3 {
            msg!("Invalid threshold");
            return Err(MultiSigWalletError::InvalidThreshold.into())
        }

        if owners.len() < threshold as usize {
            msg!("Invalid owners length");
            return Err(MultiSigWalletError::InvalidOwnersLength.into())
        }

        let account_info_iter = &mut accounts.iter();

        let initializer = next_account_info(account_info_iter)?;
        let base = next_account_info(account_info_iter)?;
        let client_program_derived_account = next_account_info(account_info_iter)?;
        let _to_account = next_account_info(account_info_iter)?;
        let system_program = next_account_info(account_info_iter)?;

        if !initializer.is_signer || !base.is_signer {
            msg!("Missing required signature");
            return Err(ProgramError::MissingRequiredSignature)
        }

        let (program_derived_account, bump_seed) = Pubkey::find_program_address(&[b"MultiSigWallet".as_ref(), base.key.as_ref()], program_id);

        if program_derived_account != *client_program_derived_account.key {
            msg!("Invalid seeds for PDA");
            return Err(MultiSigWalletError::InvalidPDA.into())
        }

        let account_len: usize = 1 + (4 + (3 * 32)) + 8 + (4 + 32) + 1 + 8 + (4 + (3 * 32)) + (4 + (3 * 32)) + (4 + 32) + 8 + (4 + (3 * 32)) + 8;
        let rent = Rent::get()?;
        let rent_lamports = rent.minimum_balance(account_len);

       invoke_signed(
            &system_instruction::create_account(
                initializer.key,
                client_program_derived_account.key,
                rent_lamports,
                account_len.try_into().unwrap(),
                program_id,
            ),
            &[initializer.clone(), client_program_derived_account.clone(), system_program.clone()],
            &[&[b"MultiSigWallet".as_ref(), base.key.as_ref(), &[bump_seed]]],
        )?;

        let mut account_data = try_from_slice_unchecked::<MultiSigWalletState>(&client_program_derived_account.data.borrow()).unwrap();

        if account_data.is_initialized() {
            msg!("Account already initialized");
            return Err(ProgramError::AccountAlreadyInitialized);
        }

        account_data.is_initialized = true;
        account_data.owners = owners;
        account_data.threshold = threshold;
        account_data.transaction.is_executed = true;

        account_data.serialize(&mut &mut client_program_derived_account.data.borrow_mut()[..])?;

        Ok(())
    }

    fn create_transaction(
        program_id: &Pubkey,
        accounts: &[AccountInfo],
        variant: u8,
        amount: u64,
        owners: Vec<Pubkey>,
        threshold: u64
    ) -> ProgramResult {
        let account_info_iter = &mut accounts.iter();

        let initializer = next_account_info(account_info_iter)?;
        let base = next_account_info(account_info_iter)?;
        let client_program_derived_account = next_account_info(account_info_iter)?;
        let to_account = next_account_info(account_info_iter)?;

        if client_program_derived_account.owner != program_id {
            msg!("PDA not owned by the program");
            return Err(ProgramError::IllegalOwner)
        }

        if !initializer.is_signer {
            msg!("Missing required signature");
            return Err(ProgramError::MissingRequiredSignature)
        }

        let (program_derived_account, _bump_seed) = Pubkey::find_program_address(&[b"MultiSigWallet".as_ref(), base.key.as_ref()], program_id);

        if program_derived_account != *client_program_derived_account.key {
            msg!("Invalid seeds for PDA");
            return Err(MultiSigWalletError::InvalidPDA.into())
        }

        let mut account_data = try_from_slice_unchecked::<MultiSigWalletState>(&client_program_derived_account.data.borrow()).unwrap();

        if !account_data.is_initialized() {
            msg!("Wallet not initialized");
            return Err(MultiSigWalletError::UninitializedAccount.into());
        }

        if !account_data.owners.iter().any(|owner| owner == initializer.key) {
            msg!("Initializer not an owner");
            return Err(MultiSigWalletError::InvalidOwner.into());
        }

        if !account_data.transaction.is_executed {
            msg!("Previous transaction not executed");
            return Err(MultiSigWalletError::UnexpectedTransaction.into());
        }

        account_data.transaction.is_executed = false;
        account_data.transaction.signers.append(&mut vec![initializer.key.clone()]);
        account_data.transaction.to_address = *to_account.key;
        account_data.transaction.variant = variant;

        match account_data.transaction.variant {
            0 => Self::set_owners_transaction(client_program_derived_account, &mut account_data, owners),
            1 => Self::set_threshold_transaction(client_program_derived_account, &mut account_data, threshold),
            2 => Self::send_transaction(client_program_derived_account, &mut account_data, to_account, amount),
            _ => return Err(ProgramError::InvalidInstructionData)
        }
    }

    fn set_owners_transaction(
        client_program_derived_account: &AccountInfo,
        account_data: &mut MultiSigWalletState,
        owners: Vec<Pubkey>
    ) -> ProgramResult {
        if owners.len() < account_data.threshold as usize {
            msg!("Invalid owners length");
            return Err(MultiSigWalletError::InvalidOwnersLength.into())
        }

        account_data.transaction.owners = owners;
        account_data.serialize(&mut &mut client_program_derived_account.data.borrow_mut()[..])?;

        Ok(())
    }

    fn set_threshold_transaction(
        client_program_derived_account: &AccountInfo,
        account_data: &mut MultiSigWalletState,
        threshold: u64
    ) -> ProgramResult {
        if threshold < 2 || threshold > 3 || account_data.owners.len() < threshold as usize {
            msg!("Invalid threshold");
            return Err(MultiSigWalletError::InvalidThreshold.into())
        }

        account_data.transaction.threshold = threshold;
        account_data.serialize(&mut &mut client_program_derived_account.data.borrow_mut()[..])?;

        Ok(())
    }

    fn send_transaction(
        client_program_derived_account: &AccountInfo,
        account_data: &mut MultiSigWalletState,
        to_account: &AccountInfo,
        amount: u64
    ) -> ProgramResult {
        if amount <= 0 {
            msg!("Amount needs to be higher than 0");
            return Err(ProgramError::InvalidInstructionData)
        }

        if client_program_derived_account.lamports() <= amount {
            msg!("PDA has insufficient funds");
            return Err(ProgramError::InsufficientFunds)
        }

        if *to_account.key == *client_program_derived_account.key {
            msg!("Cannot send to Self");
            return Err(ProgramError::InvalidInstructionData)
        }

        account_data.transaction.amount = amount;
        account_data.serialize(&mut &mut client_program_derived_account.data.borrow_mut()[..])?;

        Ok(())
    }

    fn confirm_transaction(
        program_id: &Pubkey,
        accounts: &[AccountInfo]
    ) -> ProgramResult {
        let account_info_iter = &mut accounts.iter();

        let initializer = next_account_info(account_info_iter)?;
        let base = next_account_info(account_info_iter)?;
        let client_program_derived_account = next_account_info(account_info_iter)?;

        if client_program_derived_account.owner != program_id {
            msg!("PDA not owned by the program");
            return Err(ProgramError::IllegalOwner)
        }

        if !initializer.is_signer {
            msg!("Missing required signature");
            return Err(ProgramError::MissingRequiredSignature)
        }

        let (program_derived_account, _bump_seed) = Pubkey::find_program_address(&[b"MultiSigWallet".as_ref(), base.key.as_ref()], program_id);

        if program_derived_account != *client_program_derived_account.key {
            msg!("Invalid seeds for PDA");
            return Err(MultiSigWalletError::InvalidPDA.into())
        }

        let mut account_data = try_from_slice_unchecked::<MultiSigWalletState>(&client_program_derived_account.data.borrow()).unwrap();

        msg!("account_data ${:?}", account_data);

        if !account_data.is_initialized() {
            msg!("Wallet not initialized");
            return Err(MultiSigWalletError::UninitializedAccount.into());
        }

        if !account_data.owners.iter().any(|owner| owner == initializer.key) {
            msg!("Initializer not an owner");
            return Err(MultiSigWalletError::InvalidOwner.into());
        }

        if account_data.transaction.is_executed {
            msg!("Transaction has been executed already");
            return Err(MultiSigWalletError::UnexpectedInstruction.into());
        }

        if account_data.transaction.signers.iter().any(|owner| owner == initializer.key) {
            msg!("Initializer already signed the transaction");
            return Err(MultiSigWalletError::InvalidInstruction.into());
        }

        account_data.transaction.opponents.retain(|owner| owner != initializer.key);
        account_data.transaction.signers.append(&mut vec![initializer.key.clone()]);
        account_data.serialize(&mut &mut client_program_derived_account.data.borrow_mut()[..])?;

        Ok(())
    }

    fn reject_transaction(
        program_id: &Pubkey,
        accounts: &[AccountInfo]
    ) -> ProgramResult {
        let account_info_iter = &mut accounts.iter();

        let initializer = next_account_info(account_info_iter)?;
        let base = next_account_info(account_info_iter)?;
        let client_program_derived_account = next_account_info(account_info_iter)?;

        if client_program_derived_account.owner != program_id {
            msg!("PDA not owned by the program");
            return Err(ProgramError::IllegalOwner)
        }

        if !initializer.is_signer {
            msg!("Missing required signature");
            return Err(ProgramError::MissingRequiredSignature)
        }

        let (program_derived_account, _bump_seed) = Pubkey::find_program_address(&[b"MultiSigWallet".as_ref(), base.key.as_ref()], program_id);

        if program_derived_account != *client_program_derived_account.key {
            msg!("Invalid seeds for PDA");
            return Err(MultiSigWalletError::InvalidPDA.into())
        }

        let mut account_data = try_from_slice_unchecked::<MultiSigWalletState>(&client_program_derived_account.data.borrow()).unwrap();

        if !account_data.is_initialized() {
            msg!("Wallet not initialized");
            return Err(MultiSigWalletError::UninitializedAccount.into());
        }

        if !account_data.owners.iter().any(|owner| owner == initializer.key) {
            msg!("Initializer not an owner");
            return Err(MultiSigWalletError::InvalidOwner.into());
        }

        if account_data.transaction.is_executed {
            msg!("Transaction has been executed already");
            return Err(MultiSigWalletError::UnexpectedInstruction.into());
        }

        if account_data.transaction.opponents.iter().any(|owner| owner == initializer.key) {
            msg!("Initializer already rejected the transaction");
            return Err(MultiSigWalletError::InvalidInstruction.into());
        }

        account_data.transaction.signers.retain(|owner| owner != initializer.key);
        account_data.transaction.opponents.append(&mut vec![initializer.key.clone()]);
        account_data.serialize(&mut &mut client_program_derived_account.data.borrow_mut()[..])?;

        Ok(())
    }

    fn execute_transaction(
        program_id: &Pubkey,
        accounts: &[AccountInfo]
    ) -> ProgramResult {
        let account_info_iter = &mut accounts.iter();

        let initializer = next_account_info(account_info_iter)?;
        let base = next_account_info(account_info_iter)?;
        let client_program_derived_account = next_account_info(account_info_iter)?;
        let to_account = next_account_info(account_info_iter)?;

        if client_program_derived_account.owner != program_id {
            msg!("PDA not owned by the program");
            return Err(ProgramError::IllegalOwner)
        }

        if !initializer.is_signer {
            msg!("Missing required signature");
            return Err(ProgramError::MissingRequiredSignature)
        }

        let (program_derived_account, _bump_seed) = Pubkey::find_program_address(&[b"MultiSigWallet".as_ref(), base.key.as_ref()], program_id);

        if program_derived_account != *client_program_derived_account.key {
            msg!("Invalid seeds for PDA");
            return Err(MultiSigWalletError::InvalidPDA.into())
        }

        let mut account_data = try_from_slice_unchecked::<MultiSigWalletState>(&client_program_derived_account.data.borrow()).unwrap();

        if !account_data.is_initialized() {
            msg!("Wallet not initialized");
            return Err(MultiSigWalletError::UninitializedAccount.into());
        }

        if !account_data.owners.iter().any(|owner| owner == initializer.key) {
            msg!("Initializer not an owner");
            return Err(MultiSigWalletError::InvalidOwner.into());
        }

        if account_data.transaction.is_executed {
            msg!("Transaction has been executed already");
            return Err(MultiSigWalletError::UnexpectedInstruction.into());
        }

        if account_data.transaction.to_address != *to_account.key {
            msg!("The provided address does not match with the stored address");
            return Err(MultiSigWalletError::InvalidInstruction.into());
        }

        if account_data.transaction.signers.len() < account_data.threshold as usize {
            msg!("Not enough approvals");
            return Err(MultiSigWalletError::NotEnoughApprovals.into());
        }

        match account_data.transaction.variant {
            0 => Self::set_owners(client_program_derived_account, &mut account_data),
            1 => Self::set_threshold(client_program_derived_account, &mut account_data),
            2 => Self::send(client_program_derived_account, &mut account_data, to_account),
            _ => return Err(ProgramError::InvalidInstructionData)
        }
    }

    fn set_owners(
        client_program_derived_account: &AccountInfo,
        account_data: &mut MultiSigWalletState,
    ) -> ProgramResult {
        account_data.owners = account_data.transaction.owners.clone();
        Self::clear_transaction_state(account_data);
        account_data.serialize(&mut &mut client_program_derived_account.data.borrow_mut()[..])?;

        Ok(())
    }

    fn set_threshold(
        client_program_derived_account: &AccountInfo,
        account_data: &mut MultiSigWalletState,
    ) -> ProgramResult {
        account_data.threshold = account_data.transaction.threshold;
        Self::clear_transaction_state(account_data);
        account_data.serialize(&mut &mut client_program_derived_account.data.borrow_mut()[..])?;

        Ok(())
    }

    fn send(
        client_program_derived_account: &AccountInfo,
        account_data: &mut MultiSigWalletState,
        to_account: &AccountInfo,
    ) -> ProgramResult {
        **client_program_derived_account.try_borrow_mut_lamports()? -= account_data.transaction.amount;
        **to_account.try_borrow_mut_lamports()? += account_data.transaction.amount;

        Self::clear_transaction_state(account_data);
        account_data.serialize(&mut &mut client_program_derived_account.data.borrow_mut()[..])?;

        Ok(())
    }

    fn cancel_transaction(
        program_id: &Pubkey,
        accounts: &[AccountInfo]
    ) -> ProgramResult {
        let account_info_iter = &mut accounts.iter();

        let initializer = next_account_info(account_info_iter)?;
        let base = next_account_info(account_info_iter)?;
        let client_program_derived_account = next_account_info(account_info_iter)?;

        if client_program_derived_account.owner != program_id {
            msg!("PDA not owned by the program");
            return Err(ProgramError::IllegalOwner)
        }

        if !initializer.is_signer {
            msg!("Missing required signature");
            return Err(ProgramError::MissingRequiredSignature)
        }

        let (program_derived_account, _bump_seed) = Pubkey::find_program_address(&[b"MultiSigWallet".as_ref(), base.key.as_ref()], program_id);

        if program_derived_account != *client_program_derived_account.key {
            msg!("Invalid seeds for PDA");
            return Err(MultiSigWalletError::InvalidPDA.into())
        }

        let mut account_data = try_from_slice_unchecked::<MultiSigWalletState>(&client_program_derived_account.data.borrow()).unwrap();

        if !account_data.is_initialized() {
            msg!("Wallet not initialized");
            return Err(MultiSigWalletError::UninitializedAccount.into());
        }

        if !account_data.owners.iter().any(|owner| owner == initializer.key) {
            msg!("Initializer not an owner");
            return Err(MultiSigWalletError::InvalidOwner.into());
        }

        if account_data.transaction.is_executed {
            msg!("Transaction has been executed already");
            return Err(MultiSigWalletError::UnexpectedInstruction.into());
        }

        Self::clear_transaction_state(&mut account_data);
        account_data.serialize(&mut &mut client_program_derived_account.data.borrow_mut()[..])?;

        Ok(())
    }

    fn clear_transaction_state(
        account_data: &mut MultiSigWalletState,
    ) {
        account_data.transaction.amount = 0;
        account_data.transaction.owners = Vec::new();
        account_data.transaction.threshold = 0;
        account_data.transaction.is_executed = true;
        account_data.transaction.signers = Vec::new();
        account_data.transaction.opponents = Vec::new();
    }
}
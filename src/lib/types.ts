// Event signup status values
export enum EventSignupStatus {
	Listed = 'listed',
	Waitlist = 'waitlist',
	Locked = 'locked',
	Withdrawn = 'withdrawn',
	Removed = 'removed'
}

// Transaction type values
export enum TransactionType {
	BankDeposit = 'bank_deposit',
	SignupDeduction = 'signup_deduction',
	WithdrawRefund = 'withdraw_refund'
}

// User role values
export enum UserRole {
	User = 'user',
	Admin = 'admin'
}

// Account type values
export enum AccountType {
	PlusOne = 'plusone',
	Company = 'company'
}

// Event visibility values
export enum EventVisibility {
	Private = 'private',
	OnlyCompany = 'onlyCompany',
	Public = 'public'
}

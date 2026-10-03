package model

import "time"

type Account struct {
	ID            string    `gorm:"primaryKey;size:43" json:"id"`
	Username      string    `gorm:"uniqueIndex;size:32;not null" json:"username"`
	PasswordHash  string    `gorm:"size:100" json:"-"`
	GoogleSubject *string   `gorm:"uniqueIndex;size:255" json:"-"`
	CreatedAt     time.Time `json:"-"`
}

func (Account) TableName() string { return "picklah_accounts" }

type AccountSession struct {
	TokenHash string    `gorm:"primaryKey;size:64"`
	AccountID string    `gorm:"index;size:43;not null"`
	ExpiresAt time.Time `gorm:"index;not null"`
}

func (AccountSession) TableName() string { return "picklah_account_sessions" }

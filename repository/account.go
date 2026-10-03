package repository

import (
	"context"
	"github.com/CheeHooi97/picklah/model"
	"gorm.io/gorm"
	"time"
)

type AccountRepository struct{ db *gorm.DB }

func NewAccountRepository(db *gorm.DB) *AccountRepository { return &AccountRepository{db: db} }
func (r *AccountRepository) Create(ctx context.Context, account *model.Account) error {
	return r.db.WithContext(ctx).Create(account).Error
}
func (r *AccountRepository) ByUsername(ctx context.Context, username string) (*model.Account, error) {
	var account model.Account
	err := r.db.WithContext(ctx).Where("username = ?", username).First(&account).Error
	return &account, err
}
func (r *AccountRepository) ByGoogleSubject(ctx context.Context, subject string) (*model.Account, error) {
	var account model.Account
	err := r.db.WithContext(ctx).Where("google_subject = ?", subject).First(&account).Error
	return &account, err
}
func (r *AccountRepository) SaveSession(ctx context.Context, session *model.AccountSession) error {
	return r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		if err := tx.Where("expires_at < ?", time.Now()).Delete(&model.AccountSession{}).Error; err != nil {
			return err
		}
		return tx.Create(session).Error
	})
}
func (r *AccountRepository) SessionAccount(ctx context.Context, hash string) (*model.Account, error) {
	var session model.AccountSession
	if err := r.db.WithContext(ctx).Where("token_hash = ? AND expires_at > ?", hash, time.Now()).First(&session).Error; err != nil {
		return nil, err
	}
	var account model.Account
	err := r.db.WithContext(ctx).First(&account, "id = ?", session.AccountID).Error
	return &account, err
}
func (r *AccountRepository) DeleteSession(ctx context.Context, hash string) error {
	return r.db.WithContext(ctx).Where("token_hash = ?", hash).Delete(&model.AccountSession{}).Error
}

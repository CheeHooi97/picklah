package repository

import (
	"errors"
	"github.com/CheeHooi97/picklah/model"

	"gorm.io/gorm"
)

type UserRepository interface {
	CreateUser(user *model.User) error
	GetUserById(id string) (*model.User, error)
	GetUserByUserNameAndCompanyId(username, companyId string) (*model.User, error)
	GetUserByUserName(username string) (*model.User, error)
	GetUserInfoByFriendIds(ids []string) ([]*model.User, error)
	GetUserByEmail(email string) (*model.User, error)
	UpdateUser(user *model.User) error
	DeleteUser(id string) error
}

type userRepository struct {
	db *gorm.DB
}

func NewUserRepository(db *gorm.DB) UserRepository {
	return &userRepository{db: db}
}

func (r *userRepository) CreateUser(user *model.User) error {
	result := r.db.Create(user)
	if result.Error != nil {
		return result.Error
	}
	return nil
}

func (r *userRepository) GetUserById(id string) (*model.User, error) {
	var user model.User
	result := r.db.First(&user, id)
	if result.Error != nil {
		if !errors.Is(result.Error, gorm.ErrRecordNotFound) {
			return nil, result.Error
		}
	}
	return &user, nil
}

func (r *userRepository) GetUserByEmail(email string) (*model.User, error) {
	var user model.User
	result := r.db.Where("email = ?", email).First(&user)

	if result.Error != nil {
		if !errors.Is(result.Error, gorm.ErrRecordNotFound) {
			return nil, result.Error
		}
	}

	return &user, nil
}

func (r *userRepository) GetUserByUserNameAndCompanyId(username, companyId string) (*model.User, error) {
	var user model.User
	result := r.db.Where("username = ? AND company_id = ?", username, companyId).First(&user)

	if result.Error != nil {
		if !errors.Is(result.Error, gorm.ErrRecordNotFound) {
			return nil, result.Error
		}
	}

	return &user, nil
}

func (r *userRepository) GetUserByUserName(username string) (*model.User, error) {
	var user model.User
	result := r.db.Where("username = ?", username).First(&user)

	if result.Error != nil {
		if !errors.Is(result.Error, gorm.ErrRecordNotFound) {
			return nil, result.Error
		}
	}

	return &user, nil
}

func (r *userRepository) GetUserInfoByFriendIds(ids []string) ([]*model.User, error) {
	var users []*model.User
	result := r.db.Where("id IN (?)", ids).Find(&users)

	if result.Error != nil {
		if !errors.Is(result.Error, gorm.ErrRecordNotFound) {
			return nil, result.Error
		}

	}

	return users, nil
}

func (r *userRepository) UpdateUser(user *model.User) error {
	result := r.db.Save(user)
	if result.Error != nil {
		return result.Error
	}
	return nil
}

func (r *userRepository) DeleteUser(id string) error {
	result := r.db.Model(&model.User{}).Where("id = ?", id).Update("status", false)
	return result.Error
}

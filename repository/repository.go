package repository

import "gorm.io/gorm"

type Repositories struct {
	UserRepo    UserRepository
	AdminRepo   AdminRepository
	CompanyRepo CompanyRepository
	WheelRepo   WheelRepository
}

func InitializeRepository(db *gorm.DB) *Repositories {
	return &Repositories{
		UserRepo:    NewUserRepository(db),
		AdminRepo:   NewAdminRepository(db),
		CompanyRepo: NewCompanyRepository(db),
		WheelRepo:   NewWheelRepository(db),
	}
}

package repository

import (
	"errors"
	"github.com/CheeHooi97/picklah/model"

	"gorm.io/gorm"
)

type CompanyRepository interface {
	CreateCompany(company *model.Company) error
	GetCompanyById(id string) (*model.Company, error)
	UpdateCompany(company *model.Company) error
	DeleteCompany(id string) error
}

type companyRepository struct {
	db *gorm.DB
}

func NewCompanyRepository(db *gorm.DB) CompanyRepository {
	return &companyRepository{db: db}
}

func (r *companyRepository) CreateCompany(company *model.Company) error {
	result := r.db.Create(company)
	if result.Error != nil {
		return result.Error
	}
	return nil
}

func (r *companyRepository) GetCompanyById(id string) (*model.Company, error) {
	var company model.Company
	result := r.db.First(&company, id)
	if result.Error != nil {
		if !errors.Is(result.Error, gorm.ErrRecordNotFound) {
			return nil, result.Error
		}
	}
	return &company, nil
}

func (r *companyRepository) UpdateCompany(company *model.Company) error {
	result := r.db.Save(company)
	if result.Error != nil {
		return result.Error
	}
	return nil
}

func (r *companyRepository) DeleteCompany(id string) error {
	result := r.db.Model(&model.Company{}).Where("id = ?", id).Update("status", false)
	return result.Error
}

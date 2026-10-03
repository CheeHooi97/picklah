package service

import (
	"github.com/CheeHooi97/picklah/model"
	"github.com/CheeHooi97/picklah/repository"
)

type CompanyService struct {
	companyRepo repository.CompanyRepository
}

func NewCompanyService(companyRepo repository.CompanyRepository) *CompanyService {
	return &CompanyService{companyRepo: companyRepo}
}

func (s *CompanyService) CreateCompany(company *model.Company) error {
	return s.companyRepo.CreateCompany(company)
}

func (s *CompanyService) GetCompanyById(id string) (*model.Company, error) {
	return s.companyRepo.GetCompanyById(id)
}

func (s *CompanyService) UpdateCompany(company *model.Company) error {
	return s.companyRepo.UpdateCompany(company)
}

func (s *CompanyService) DeleteCompany(id string) error {
	return s.companyRepo.DeleteCompany(id)
}

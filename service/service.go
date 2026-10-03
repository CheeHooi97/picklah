package service

import "github.com/CheeHooi97/picklah/repository"

type Services struct {
	UserService     *UserService
	AdminService    *AdminService
	CompanyService  *CompanyService
	WheelService    *WheelService
	TemplateService *TemplateService
}

func InitializeService(repos *repository.Repositories) *Services {
	templates := NewTemplateService()
	return &Services{
		UserService:     NewUserService(repos.UserRepo),
		AdminService:    NewAdminService(repos.AdminRepo),
		CompanyService:  NewCompanyService(repos.CompanyRepo),
		WheelService:    NewWheelService(repos.WheelRepo, templates),
		TemplateService: templates,
	}
}

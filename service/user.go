package service

import (
	"github.com/CheeHooi97/picklah/model"
	"github.com/CheeHooi97/picklah/repository"
)

type UserService struct {
	userRepo repository.UserRepository
}

func NewUserService(userRepo repository.UserRepository) *UserService {
	return &UserService{userRepo: userRepo}
}

func (s *UserService) CreateUser(user *model.User) error {
	return s.userRepo.CreateUser(user)
}

func (s *UserService) GetUserById(id string) (*model.User, error) {
	return s.userRepo.GetUserById(id)
}

func (s *UserService) GetUserByUserNameAndCompanyId(username, companyId string) (*model.User, error) {
	return s.userRepo.GetUserByUserNameAndCompanyId(username, companyId)
}

func (s *UserService) GetUserByUserName(username string) (*model.User, error) {
	return s.userRepo.GetUserByUserName(username)
}

func (s *UserService) GetUserInfoByFriendIds(ids []string) ([]*model.User, error) {
	return s.userRepo.GetUserInfoByFriendIds(ids)
}

func (s *UserService) GetUserByEmail(email string) (*model.User, error) {
	return s.userRepo.GetUserByEmail(email)
}

func (s *UserService) UpdateUser(user *model.User) error {
	return s.userRepo.UpdateUser(user)
}

func (s *UserService) DeleteUser(id string) error {
	return s.userRepo.DeleteUser(id)
}

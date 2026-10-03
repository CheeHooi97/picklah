package service

import "github.com/CheeHooi97/picklah/dto"

type TemplateService struct{}

func NewTemplateService() *TemplateService { return &TemplateService{} }

func (s *TemplateService) List() []dto.TemplateResponse {
	return []dto.TemplateResponse{
		{Key: "what-makan", Title: "What makan?", Description: "Pick a Malaysian food favourite.", Options: []string{"Pan Mee", "Nasi Lemak", "Roti Canai", "Chicken Rice", "Bak Kut Teh", "Satay", "Sushi", "Burger"}},
		{Key: "where-to-eat", Title: "Where should we eat?", Description: "Add nearby places or choose a type of place.", Options: []string{"Mamak", "Food court", "Hawker centre", "Cafe"}},
		{Key: "who-pays", Title: "Who pays today?", Description: "Add the people in your group.", Options: []string{}},
		{Key: "who-does-the-task", Title: "Who does the task?", Description: "Add names, then decide who goes first.", Options: []string{}},
		{Key: "what-movie", Title: "What movie tonight?", Description: "Add the movies you are considering.", Options: []string{}},
		{Key: "what-game", Title: "What game do we play?", Description: "Add games your group can play.", Options: []string{}},
	}
}

func (s *TemplateService) Get(key string) (dto.TemplateResponse, bool) {
	for _, item := range s.List() {
		if item.Key == key {
			return item, true
		}
	}
	return dto.TemplateResponse{}, false
}

package model

import "time"

type User struct {
	Id        string `gorm:"primaryKey" json:"id"`
	CompanyId string `json:"companyId"`
	Username  string `json:"username"`
	Email     string `json:"email"`
	PhotoURL  string `json:"photoUrl" gorm:"type:text"`
	FcmToken  string `json:"fcmToken"`
	Status    bool   `json:"status"`
	BaseModel
}

func (m *User) DateTime() {
	m.CreatedDateTime = time.Now().UTC()
	m.UpdatedDateTime = time.Now().UTC()
}

func (m *User) UpdateDt() {
	m.UpdatedDateTime = time.Now().UTC()
}

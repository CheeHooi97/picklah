package model

import "time"

type Company struct {
	Id     string `gorm:"primaryKey" json:"id"`
	Name   string `json:"name"`
	Host   string `json:"host"`
	Status bool   `json:"status"`
	AppId  string `json:"appId"`
	AppKey string `json:"appKey"`
	BaseModel
}

func (m *Company) DateTime() {
	m.CreatedDateTime = time.Now().UTC()
	m.UpdatedDateTime = time.Now().UTC()
}

func (m *Company) UpdateDt() {
	m.UpdatedDateTime = time.Now().UTC()
}

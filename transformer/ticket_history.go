package transformer

import (
	"github.com/CheeHooi97/picklah/model"
)

type TicketHistory struct {
	Id         string `json:"id"`
	TicketId   string `json:"ticketId"`
	SenderId   string `json:"senderId"`
	ReceiverId string `json:"receiverId"`
	Message    string `json:"message,omitempty"`
	MediaUrl   string `json:"mediaUrl,omitempty"`
	MediaType  string `json:"mediaType,omitempty"` // image, video, etc.
	MediaName  string `json:"mediaName,omitempty"`
	IsRead     bool   `json:"isRead"`
	Status     bool   `json:"status"`
	// Username   string `json:"username"`
	// PhotoURL   string `json:"photoUrl" sqlike:",longtext"`
	model.BaseModel
}

// func ToTicketHistory(m *model.TicketMessage, mediaName, mediaUrl, msg string, t int64) *TicketHistory {
// 	ticket := TicketHistory{
// 		Id:         m.Id,
// 		TicketId:   m.TicketId,
// 		SenderId:   m.SenderId,
// 		ReceiverId: m.ReceiverId,
// 		Message:    msg,
// 		MediaUrl:   mediaUrl,
// 		MediaType:  m.MediaType,
// 		MediaName:  mediaName,
// 		IsRead:     m.IsRead,
// 		Status:     m.Status,
// 		// Username:   u.Username,
// 		// PhotoURL:   u.PhotoURL,
// 		BaseModel: m.BaseModel,
// 	}

// 	return &ticket
// }

package transformer

import (
	"github.com/CheeHooi97/picklah/model"
)

type TicketList struct {
	TicketId   string `json:"ticketId"`
	Title      string `json:"title"`
	Message    string `json:"message,omitempty"`
	MediaUrl   string `json:"mediaUrl,omitempty"`
	MediaType  string `json:"mediaType,omitempty"`
	IsRead     bool   `json:"isRead"`
	Status     bool   `json:"status"`
	Count      int64  `json:"count"`
	LastReadId string `json:"lastReadId"`
	model.BaseModel
}

// func ToTicketList(d *model.Ticket, t *model.TicketMessage, count int64, lastReadId string) *TicketList {
// 	ticket := TicketList{
// 		TicketId:  d.Id,
// 		Title:     d.Message,
// 		Count:     count,
// 		BaseModel: d.BaseModel,
// 	}

// 	if t != nil {
// 		ticket.Message = t.Message
// 		ticket.MediaUrl = t.MediaUrl
// 		ticket.MediaType = t.MediaType
// 		ticket.IsRead = t.IsRead
// 		ticket.Status = t.Status
// 		ticket.BaseModel = t.BaseModel
// 		ticket.LastReadId = lastReadId
// 	}

// 	return &ticket
// }

// func ToTicketLists(d []*model.Ticket, ticketMsgMap map[string]*model.TicketMessage, countMap map[string]int64, lastReadIdMap map[string]string) []*TicketList {
// 	size := len(d)
// 	o := make([]*TicketList, size)
// 	pool := grpool.NewPool(20, 20)
// 	pool.WaitCount(size)
// 	defer pool.Release()
// 	for n, item := range d {
// 		pool.JobQueue <- func(index int, val *model.Ticket) func() {
// 			return func() {
// 				defer pool.JobDone()
// 				o[index] = ToTicketList(val, ticketMsgMap[val.Id], countMap[val.Id], lastReadIdMap[val.Id])
// 			}
// 		}(n, item)
// 	}
// 	pool.WaitAll()
// 	return o
// }

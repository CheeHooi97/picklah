package middleware

import (
	"net/http"
	"sync"
	"time"

	"github.com/CheeHooi97/picklah/dto"
	"github.com/labstack/echo/v4"
)

type rateLimitEntry struct {
	count int
	start time.Time
}

type fixedWindowLimiter struct {
	mu      sync.Mutex
	entries map[string]rateLimitEntry
	limit   int
	window  time.Duration
}

func NewFixedWindowLimiter(limit int, window time.Duration) echo.MiddlewareFunc {
	limiter := &fixedWindowLimiter{entries: make(map[string]rateLimitEntry), limit: limit, window: window}
	return limiter.middleware
}

func (l *fixedWindowLimiter) middleware(next echo.HandlerFunc) echo.HandlerFunc {
	return func(c echo.Context) error {
		key := c.RealIP()
		now := time.Now()
		l.mu.Lock()
		entry, ok := l.entries[key]
		if !ok || now.Sub(entry.start) >= l.window {
			entry = rateLimitEntry{start: now}
		}
		entry.count++
		l.entries[key] = entry
		allowed := entry.count <= l.limit
		if len(l.entries) > 4096 {
			for address, current := range l.entries {
				if now.Sub(current.start) >= l.window {
					delete(l.entries, address)
				}
			}
		}
		l.mu.Unlock()

		if !allowed {
			return c.JSON(http.StatusTooManyRequests, dto.ErrorResponse{Error: dto.APIError{Code: "RATE_LIMITED", Message: "Please wait a moment before trying again."}})
		}
		return next(c)
	}
}

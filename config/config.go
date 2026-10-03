package config

import (
	"log"
	"os"
	"strconv"
	"strings"

	"github.com/joho/godotenv"
)

var (
	Env                     string
	DBHost                  string
	DBPort                  string
	DBUser                  string
	DBPassword              string
	DBName                  string
	DBSSLMode               string
	DBTimeZone              string
	AutoMigrate             bool
	SystemAesKey            string
	ServerPort              string
	ServerHost              string
	AllowedOrigins          []string
	PicklahSiteURL          string
	GoogleOAuthClientID     string
	GoogleOAuthClientSecret string
	GoogleOAuthRedirectURL  string
)

// LoadConfig
func LoadConfig() {
	_ = godotenv.Load()

	Env = getEnvOrDefault("ENV", "development")
	DBHost = GetEnv("POSTGRES_HOST")
	DBPort = GetEnv("POSTGRES_PORT")
	DBUser = GetEnv("POSTGRES_USER")
	DBPassword = GetEnv("POSTGRES_PASSWORD")
	DBName = GetEnv("POSTGRES_DATABASE")
	DBSSLMode = getEnvOrDefault("POSTGRES_SSLMODE", "require")
	DBTimeZone = getEnvOrDefault("POSTGRES_TIMEZONE", "UTC")
	var err error
	AutoMigrate, err = strconv.ParseBool(getEnvOrDefault("POSTGRES_AUTO_MIGRATE", "true"))
	if err != nil {
		log.Fatalf("POSTGRES_AUTO_MIGRATE must be a boolean: %v", err)
	}
	SystemAesKey = os.Getenv("SYSTEM_AES_KEY")
	ServerPort = getEnvOrDefault("PORT", "2001")
	ServerHost = getEnvOrDefault("HOST", "0.0.0.0")
	AllowedOrigins = loadAllowedOrigins()
	PicklahSiteURL = strings.TrimRight(getEnvOrDefault("PICKLAH_SITE_URL", "http://127.0.0.1:5173"), "/")
	GoogleOAuthClientID = getEnvOrDefault("GOOGLE_OAUTH_CLIENT_ID", os.Getenv("GOOGLE_CLIENT_ID"))
	GoogleOAuthClientSecret = os.Getenv("GOOGLE_OAUTH_CLIENT_SECRET")
	GoogleOAuthRedirectURL = getEnvOrDefault("GOOGLE_OAUTH_REDIRECT_URL", PicklahSiteURL+"/v1/auth/oauth/google/callback")
}

func loadAllowedOrigins() []string {
	configured := strings.TrimSpace(os.Getenv("PICKLAH_ALLOWED_ORIGINS"))
	if configured == "" {
		return []string{"http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:4173", "http://localhost", "https://localhost", "capacitor://localhost"}
	}

	parts := strings.Split(configured, ",")
	origins := make([]string, 0, len(parts))
	for _, origin := range parts {
		origin = strings.TrimSpace(origin)
		if origin != "" {
			origins = append(origins, origin)
		}
	}
	return origins
}

func getEnvOrDefault(key, fallback string) string {
	if value, exists := os.LookupEnv(key); exists && strings.TrimSpace(value) != "" {
		return value
	}
	return fallback
}

func GetEnv(key string) string {
	value, exists := os.LookupEnv(key)
	if !exists {
		log.Fatalf("%s environment variable not set", key)
	}
	return value
}

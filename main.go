package main

import (
	"context"
	"log"
	"net"
	"net/http"
	"net/url"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/CheeHooi97/picklah/config"
	"github.com/CheeHooi97/picklah/database"
	"github.com/CheeHooi97/picklah/handler"
	"github.com/CheeHooi97/picklah/repository"
	"github.com/CheeHooi97/picklah/router"
	"github.com/CheeHooi97/picklah/service"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
	"gorm.io/gorm/schema"
)

func main() {
	config.LoadConfig()
	dsn := postgresDSN()
	db, err := gorm.Open(postgres.New(postgres.Config{
		DSN:                  dsn,
		PreferSimpleProtocol: true,
	}), &gorm.Config{
		Logger: logger.New(log.New(os.Stderr, "", log.LstdFlags), logger.Config{
			LogLevel:             logger.Warn,
			SlowThreshold:        time.Second,
			ParameterizedQueries: true,
		}),
		NamingStrategy: schema.NamingStrategy{
			SingularTable: true,
		},
	})
	if err != nil {
		log.Fatal("Failed to connect to the database:", err)
	}
	sqlDB, err := db.DB()
	if err != nil {
		log.Fatal("Failed to initialize database pool:", err)
	}
	defer sqlDB.Close()

	sqlDB.SetMaxOpenConns(10)
	sqlDB.SetMaxIdleConns(5)
	sqlDB.SetConnMaxLifetime(30 * time.Minute)
	sqlDB.SetConnMaxIdleTime(5 * time.Minute)

	migrateOnly := len(os.Args) > 1 && os.Args[1] == "migrate"
	if config.AutoMigrate || migrateOnly {
		if err := database.Migrate(db); err != nil {
			log.Fatal("Failed to migrate database:", err)
		}
	}
	if migrateOnly {
		log.Println("Database migration completed.")
		return
	}

	repos := repository.InitializeRepository(db)
	services := service.InitializeService(repos)
	h := handler.NewHandler(services)
	e := router.SetupRoutes(h, db)

	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()
	serverErr := make(chan error, 1)
	go func() {
		serverErr <- e.Start(net.JoinHostPort(config.ServerHost, config.ServerPort))
	}()
	select {
	case err := <-serverErr:
		if err != nil && err != http.ErrServerClosed {
			log.Fatalf("Failed to start server: %v", err)
		}
	case <-ctx.Done():
	}

	shutdownCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	if err := e.Shutdown(shutdownCtx); err != nil {
		log.Fatalf("Server forced to shutdown: %v", err)
	}
}

func postgresDSN() string {
	connectionURL := &url.URL{
		Scheme: "postgres",
		Host:   net.JoinHostPort(config.DBHost, config.DBPort),
		Path:   "/" + config.DBName,
		User:   url.UserPassword(config.DBUser, config.DBPassword),
	}
	query := connectionURL.Query()
	query.Set("sslmode", config.DBSSLMode)
	query.Set("timezone", config.DBTimeZone)
	connectionURL.RawQuery = query.Encode()
	return connectionURL.String()
}

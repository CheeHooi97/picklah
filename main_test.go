package main

import (
	"net/url"
	"sync"
	"testing"

	"github.com/CheeHooi97/picklah/config"
	"github.com/CheeHooi97/picklah/model"
	"gorm.io/gorm/schema"
)

func TestPostgresDSNEncodesCredentialsAndOptions(t *testing.T) {
	oldHost, oldPort := config.DBHost, config.DBPort
	oldUser, oldPassword, oldName := config.DBUser, config.DBPassword, config.DBName
	oldSSLMode, oldTimeZone := config.DBSSLMode, config.DBTimeZone
	t.Cleanup(func() {
		config.DBHost, config.DBPort = oldHost, oldPort
		config.DBUser, config.DBPassword, config.DBName = oldUser, oldPassword, oldName
		config.DBSSLMode, config.DBTimeZone = oldSSLMode, oldTimeZone
	})

	config.DBHost = "db.example.test"
	config.DBPort = "5432"
	config.DBUser = "picklah user"
	config.DBPassword = "p@ss:/%word"
	config.DBName = "picklah"
	config.DBSSLMode = "require"
	config.DBTimeZone = "Asia/Kuala_Lumpur"

	parsed, err := url.Parse(postgresDSN())
	if err != nil {
		t.Fatalf("parse DSN: %v", err)
	}
	username := parsed.User.Username()
	password, ok := parsed.User.Password()
	if !ok || username != config.DBUser || password != config.DBPassword {
		t.Fatalf("DSN did not preserve credentials")
	}
	if parsed.Query().Get("sslmode") != config.DBSSLMode {
		t.Fatalf("unexpected sslmode in DSN: %q", parsed.Query().Get("sslmode"))
	}
	if parsed.Query().Get("timezone") != config.DBTimeZone {
		t.Fatalf("unexpected timezone in DSN: %q", parsed.Query().Get("timezone"))
	}
}

func TestPostgresNamingUsesLowercaseSnakeCase(t *testing.T) {
	naming := schema.NamingStrategy{SingularTable: true}
	if got := naming.TableName("Company"); got != "company" {
		t.Fatalf("table name = %q, want company", got)
	}
	if got := naming.ColumnName("Company", "AppId"); got != "app_id" {
		t.Fatalf("column name = %q, want app_id", got)
	}

	parsed, err := schema.Parse(&model.Company{}, &sync.Map{}, naming)
	if err != nil {
		t.Fatalf("parse model schema: %v", err)
	}
	if got := parsed.LookUpField("AppId").DBName; got != "app_id" {
		t.Fatalf("app id column = %q, want app_id", got)
	}
}

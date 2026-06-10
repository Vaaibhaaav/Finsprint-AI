package middleware

import (
	"net/http"
	"strings"

	"github.com/clerk/clerk-sdk-go/v2/jwt"
	"github.com/gin-gonic/gin"
)

func RequireAuth() gin.HandlerFunc {
	return func(c *gin.Context) {
		var tokenStr string

		authHeader := c.GetHeader("Authorization")
		if authHeader != "" {
			parts := strings.Split(authHeader, " ")
			if len(parts) == 2 && parts[0] == "Bearer" {
				tokenStr = parts[1]
			}
		}

		if tokenStr == "" {
			tokenStr = c.Query("token")
		}

		if tokenStr == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Authentication credentials missing or malformed"})
			c.Abort()
			return
		}

		claims, err := jwt.Verify(c.Request.Context(), &jwt.VerifyParams{
			Token: tokenStr,
		})
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid or expired session token"})
			c.Abort()
			return
		}

		c.Set("Id", claims.Subject)

		c.Next()
	}
}
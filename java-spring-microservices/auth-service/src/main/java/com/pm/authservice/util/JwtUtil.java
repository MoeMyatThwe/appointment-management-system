package com.pm.authservice.util;

import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.security.Keys;
import io.jsonwebtoken.security.SignatureException;
import java.nio.charset.StandardCharsets;
import java.security.Key;
import java.util.Base64;
import java.util.Date;
import javax.crypto.SecretKey;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class JwtUtil {

  private final Key secretKey;
  private final long accessTokenMinutes;

  public JwtUtil(@Value("${jwt.secret}") String secret,
      @Value("${jwt.access-token-minutes:15}") long accessTokenMinutes) {
    byte[] keyBytes = Base64.getDecoder()
        .decode(secret.getBytes(StandardCharsets.UTF_8));
    this.secretKey = Keys.hmacShaKeyFor(keyBytes);
    this.accessTokenMinutes = accessTokenMinutes;
  }

  public String generateToken(String email, String role, String tenantId) {
    return Jwts.builder()
        .subject(email)
        .claim("role", role)
        .claim("tenantId", tenantId)
        .issuedAt(new Date())
        .expiration(new Date(System.currentTimeMillis() + accessTokenMinutes * 60_000))
        .signWith(secretKey)
        .compact();
  }

  public void validateToken(String token) {
    parseClaims(token);
  }

  public Claims parseClaims(String token) {
    try {
      return Jwts.parser().verifyWith((SecretKey) secretKey)
          .build()
          .parseSignedClaims(token)
          .getPayload();
    } catch (SignatureException e) {
      throw new JwtException("Invalid JWT signature");
    } catch (JwtException e) {
      throw new JwtException("Invalid JWT");
    }
  }
}

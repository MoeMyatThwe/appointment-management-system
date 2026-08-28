package com.pm.apigateway.filter;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.cloud.gateway.filter.GatewayFilter;
import org.springframework.cloud.gateway.filter.factory.AbstractGatewayFilterFactory;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.netty.http.client.HttpClient;
import org.springframework.http.client.reactive.ReactorClientHttpConnector;
import reactor.util.retry.Retry;
import java.time.Duration;
import org.springframework.web.reactive.function.client.WebClientRequestException;
import org.springframework.web.server.ServerWebExchange;

@Component
public class JwtValidationGatewayFilterFactory extends
    AbstractGatewayFilterFactory<Object> {

  private final WebClient webClient;

  public JwtValidationGatewayFilterFactory(WebClient.Builder webClientBuilder,
      @Value("${auth.service.url}") String authServiceUrl) {
    HttpClient httpClient = HttpClient.create()
        .responseTimeout(Duration.ofSeconds(3));
    this.webClient = webClientBuilder
        .clientConnector(new ReactorClientHttpConnector(httpClient))
        .baseUrl(authServiceUrl)
        .build();
  }

  @Override
  public GatewayFilter apply(Object config) {
    return (exchange, chain) -> {
      String token =
          exchange.getRequest().getHeaders().getFirst(HttpHeaders.AUTHORIZATION);

      if(token == null || !token.startsWith("Bearer ") || token.length() <= 7) {
        exchange.getResponse().setStatusCode(HttpStatus.UNAUTHORIZED);
        return exchange.getResponse().setComplete();
      }

      return webClient.get()
          .uri("/validate")
          .header(HttpHeaders.AUTHORIZATION, token)
          .retrieve()
          .toBodilessEntity()
          .retryWhen(Retry.backoff(2, Duration.ofMillis(100))
              .filter(WebClientRequestException.class::isInstance))
          .flatMap(response -> {
            String tenantId = response.getHeaders().getFirst("X-Tenant-ID");
            String role = response.getHeaders().getFirst("X-User-Role");
            String email = response.getHeaders().getFirst("X-User-Email");
            if (tenantId == null || role == null || email == null) {
              exchange.getResponse().setStatusCode(HttpStatus.UNAUTHORIZED);
              return exchange.getResponse().setComplete();
            }
            ServerWebExchange enrichedExchange = exchange.mutate()
                .request(request -> request.headers(headers -> {
                  headers.set("X-Tenant-ID", tenantId);
                  headers.set("X-User-Role", role);
                  headers.set("X-User-Email", email);
                }))
                .build();
            return chain.filter(enrichedExchange);
          })
          .onErrorResume(error -> {
            exchange.getResponse().setStatusCode(HttpStatus.UNAUTHORIZED);
            return exchange.getResponse().setComplete();
          });
    };
  }
}

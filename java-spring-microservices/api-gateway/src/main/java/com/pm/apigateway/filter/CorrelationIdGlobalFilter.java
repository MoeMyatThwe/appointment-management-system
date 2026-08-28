package com.pm.apigateway.filter;

import java.util.UUID;
import org.slf4j.MDC;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

@Component
public class CorrelationIdGlobalFilter implements GlobalFilter, Ordered {

  public static final String HEADER = "X-Correlation-ID";

  @Override
  public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
    String correlationId = exchange.getRequest().getHeaders().getFirst(HEADER);
    if (correlationId == null || correlationId.isBlank()) {
      correlationId = UUID.randomUUID().toString();
    }

    String finalCorrelationId = correlationId;
    exchange.getResponse().getHeaders().set(HEADER, finalCorrelationId);
    ServerWebExchange updatedExchange = exchange.mutate()
        .request(request -> request.headers(headers -> headers.set(HEADER, finalCorrelationId)))
        .build();

    return Mono.using(
        () -> {
          MDC.put(HEADER, finalCorrelationId);
          return finalCorrelationId;
        },
        ignored -> chain.filter(updatedExchange),
        ignored -> MDC.remove(HEADER));
  }

  @Override
  public int getOrder() {
    return Ordered.HIGHEST_PRECEDENCE;
  }
}

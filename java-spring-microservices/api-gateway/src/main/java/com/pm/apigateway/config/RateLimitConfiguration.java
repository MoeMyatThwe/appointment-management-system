package com.pm.apigateway.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.cloud.gateway.filter.ratelimit.KeyResolver;
import reactor.core.publisher.Mono;

@Configuration
public class RateLimitConfiguration {

  @Bean
  public KeyResolver ipKeyResolver() {
    return exchange -> Mono.justOrEmpty(exchange.getRequest().getRemoteAddress())
        .map(address -> address.getAddress().getHostAddress())
        .defaultIfEmpty("unknown");
  }
}

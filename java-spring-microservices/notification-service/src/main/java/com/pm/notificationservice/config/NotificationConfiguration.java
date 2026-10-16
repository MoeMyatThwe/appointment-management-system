package com.pm.notificationservice.config;

import com.pm.notificationservice.adapter.NotificationAdapter;
import com.pm.notificationservice.adapter.ProviderAdapter;
import com.pm.notificationservice.adapter.ResendEmailAdapter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class NotificationConfiguration {
  @Bean
  NotificationAdapter emailAdapter(@Value("${notification.email.provider:none}") String provider,
      @Value("${notification.email.webhook-url:}") String webhookUrl,
      @Value("${notification.email.api-key:}") String apiKey,
      @Value("${notification.email.from:}") String from) {
    if ("resend".equalsIgnoreCase(provider)) {
      return new ResendEmailAdapter(apiKey, from);
    }
    return new ProviderAdapter("email", provider, webhookUrl);
  }

  @Bean
  NotificationAdapter smsAdapter(@Value("${notification.sms.provider:none}") String provider,
      @Value("${notification.sms.webhook-url:}") String webhookUrl) {
    return new ProviderAdapter("sms", provider, webhookUrl);
  }

  @Bean
  NotificationAdapter calendarAdapter(
      @Value("${notification.calendar.provider:none}") String provider,
      @Value("${notification.calendar.webhook-url:}") String webhookUrl) {
    return new ProviderAdapter("calendar", provider, webhookUrl);
  }
}

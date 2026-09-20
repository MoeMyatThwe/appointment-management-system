package com.pm.authservice.config;

import java.util.Properties;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.JavaMailSenderImpl;

@Configuration
public class MailConfig {

  @Bean
  JavaMailSender mailSender(
      @Value("${spring.mail.host:}") String host,
      @Value("${spring.mail.port:587}") int port,
      @Value("${spring.mail.username:}") String username,
      @Value("${spring.mail.password:}") String password,
      @Value("${spring.mail.properties.mail.smtp.auth:true}") boolean smtpAuth,
      @Value("${spring.mail.properties.mail.smtp.starttls.enable:true}") boolean starttls) {
    JavaMailSenderImpl sender = new JavaMailSenderImpl();
    sender.setHost(host);
    sender.setPort(port);
    sender.setUsername(username);
    // Gmail displays app passwords with spaces; SMTP expects the compact value.
    sender.setPassword(password.replaceAll("\\s+", ""));

    Properties properties = sender.getJavaMailProperties();
    properties.put("mail.smtp.auth", Boolean.toString(smtpAuth));
    properties.put("mail.smtp.starttls.enable", Boolean.toString(starttls));
    return sender;
  }
}

package com.pm.appointmentservice.controller;

import com.pm.appointmentservice.service.StripeCheckoutService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
public class StripeWebhookController {
  private final StripeCheckoutService stripe;

  public StripeWebhookController(StripeCheckoutService stripe) {
    this.stripe = stripe;
  }

  @PostMapping("/stripe/appointment-payments/webhook")
  public ResponseEntity<Void> webhook(@RequestBody String payload,
      @RequestHeader(value = "Stripe-Signature", required = false) String signature) {
    stripe.handleWebhook(payload, signature);
    return ResponseEntity.ok().build();
  }
}

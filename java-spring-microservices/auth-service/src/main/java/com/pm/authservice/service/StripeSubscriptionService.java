package com.pm.authservice.service;

import com.pm.authservice.dto.SubscriptionCheckoutResponseDTO;
import com.pm.authservice.model.User;
import com.pm.authservice.repository.UserRepository;
import com.stripe.Stripe;
import com.stripe.exception.StripeException;
import com.stripe.model.Event;
import com.stripe.model.Subscription;
import com.stripe.model.checkout.Session;
import com.stripe.param.SubscriptionUpdateParams;
import com.stripe.param.checkout.SessionCreateParams;
import java.util.Optional;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class StripeSubscriptionService {
  private final UserRepository users;
  private final SubscriptionPlanService plans;
  private final String webhookSecret;
  private final String successUrl;
  private final String cancelUrl;

  public StripeSubscriptionService(
      UserRepository users,
      SubscriptionPlanService plans,
      @Value("${stripe.secret-key:}") String secretKey,
      @Value("${stripe.webhook-secret:}") String webhookSecret,
      @Value("${stripe.success-url:http://localhost:5173/billing?success=true}") String successUrl,
      @Value("${stripe.cancel-url:http://localhost:5173/billing?cancelled=true}") String cancelUrl) {
    this.users = users;
    this.plans = plans;
    this.webhookSecret = webhookSecret;
    this.successUrl = successUrl;
    this.cancelUrl = cancelUrl;
    Stripe.apiKey = secretKey;
  }

  public SubscriptionCheckoutResponseDTO createCheckout(User user, String planCode) {
    var plan = plans.find(planCode);
    if (plan.monthlyPriceCents() == 0) {
      throw new IllegalArgumentException("The Free plan does not require checkout");
    }
    if (Stripe.apiKey == null || Stripe.apiKey.isBlank()) {
      throw new IllegalStateException("Stripe is not configured");
    }
    try {
      var priceData = SessionCreateParams.LineItem.PriceData.builder()
          .setCurrency("usd")
          .setUnitAmount(plan.monthlyPriceCents())
          .setRecurring(SessionCreateParams.LineItem.PriceData.Recurring.builder()
              .setInterval(SessionCreateParams.LineItem.PriceData.Recurring.Interval.MONTH).build())
          .setProductData(SessionCreateParams.LineItem.PriceData.ProductData.builder()
              .setName(plan.name() + " subscription").build())
          .build();
      var params = SessionCreateParams.builder()
          .setMode(SessionCreateParams.Mode.SUBSCRIPTION)
          .setCustomerEmail(user.getEmail())
          .setClientReferenceId(user.getTenantId())
          .setSuccessUrl(successUrl)
          .setCancelUrl(cancelUrl)
          .putMetadata("tenantId", user.getTenantId())
          .putMetadata("plan", plan.code())
          .addLineItem(SessionCreateParams.LineItem.builder().setQuantity(1L).setPriceData(priceData).build())
          .build();
      return new SubscriptionCheckoutResponseDTO(Session.create(params).getUrl());
    } catch (StripeException error) {
      throw new IllegalStateException("Stripe checkout could not be created", error);
    }
  }

  public void cancel(User user) {
    if (user.getStripeSubscriptionId() == null) {
      throw new IllegalArgumentException("No active Stripe subscription");
    }
    try {
      Subscription.retrieve(user.getStripeSubscriptionId()).update(
          SubscriptionUpdateParams.builder().setCancelAtPeriodEnd(true).build());
      user.setSubscriptionStatus("CANCEL_AT_PERIOD_END");
      users.save(user);
    } catch (StripeException error) {
      throw new IllegalStateException("Stripe subscription could not be cancelled", error);
    }
  }

  public void handleWebhook(String payload, String signature) {
    try {
      Event event = com.stripe.net.Webhook.constructEvent(payload, signature, webhookSecret);
      switch (event.getType()) {
        case "checkout.session.completed" -> handleCheckout(event);
        case "customer.subscription.updated", "customer.subscription.deleted" -> handleSubscription(event);
        case "invoice.paid" -> updateCustomerStatus(event, "ACTIVE");
        case "invoice.payment_failed" -> updateCustomerStatus(event, "PAST_DUE");
        default -> { }
      }
    } catch (Exception error) {
      throw new IllegalArgumentException("Invalid Stripe webhook", error);
    }
  }

  private void handleCheckout(Event event) {
    Session session = (Session) event.getDataObjectDeserializer().getObject().orElseThrow();
    Optional<User> user = users.findFirstByTenantId(session.getClientReferenceId());
    if (user.isEmpty()) return;
    User account = user.get();
    account.setStripeCustomerId(session.getCustomer());
    account.setStripeSubscriptionId(session.getSubscription());
    String plan = session.getMetadata().get("plan");
    if (plan != null) account.setSubscriptionPlan(plan);
    account.setSubscriptionStatus("ACTIVE");
    users.save(account);
  }

  private void handleSubscription(Event event) {
    Subscription subscription = (Subscription) event.getDataObjectDeserializer().getObject().orElseThrow();
    users.findFirstByStripeSubscriptionId(subscription.getId()).ifPresent(user -> {
      user.setSubscriptionStatus("customer.subscription.deleted".equals(event.getType()) ? "CANCELED" : subscription.getStatus().toUpperCase());
      users.save(user);
    });
  }

  private void updateCustomerStatus(Event event, String status) {
    var object = event.getDataObjectDeserializer().getObject().orElseThrow();
    String customer = object instanceof com.stripe.model.Invoice invoice ? invoice.getCustomer() : null;
    if (customer != null) users.findFirstByStripeCustomerId(customer).ifPresent(user -> {
      user.setSubscriptionStatus(status);
      users.save(user);
    });
  }
}

package com.pm.authservice.service;

import com.pm.authservice.dto.SubscriptionPlanDTO;
import java.util.List;
import org.springframework.stereotype.Service;

@Service
public class SubscriptionPlanService {
  private static final List<SubscriptionPlanDTO> PLANS = List.of(
      new SubscriptionPlanDTO("FREE", "Free", 0, 2, 50),
      new SubscriptionPlanDTO("STARTER", "Starter", 2900, 5, 500),
      new SubscriptionPlanDTO("PRO", "Pro", 7900, 15, 2000),
      new SubscriptionPlanDTO("BUSINESS", "Business", 14900, 50, 10000));

  public List<SubscriptionPlanDTO> plans() {
    return PLANS;
  }

  public SubscriptionPlanDTO find(String code) {
    return PLANS.stream()
        .filter(plan -> plan.code().equalsIgnoreCase(code))
        .findFirst()
        .orElseThrow(() -> new IllegalArgumentException("Unknown subscription plan"));
  }
}

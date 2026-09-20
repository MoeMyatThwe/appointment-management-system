package com.pm.appointmentservice.util;

public record CatalogPageFilters(
    String search,
    String group,
    String tag,
    String role,
    String resourceType,
    Boolean active,
    Integer minDuration,
    Integer maxDuration) {
  public String searchValue() { return search == null ? "" : search.trim(); }
  public String groupValue() { return group == null ? "" : group.trim(); }
  public String tagValue() { return tag == null ? "" : tag.trim(); }
  public String roleValue() { return role == null ? "" : role.trim(); }
  public String resourceTypeValue() { return resourceType == null ? "" : resourceType.trim(); }
  public int minDurationValue() { return minDuration == null ? 0 : Math.max(minDuration, 0); }
  public int maxDurationValue() { return maxDuration == null ? Integer.MAX_VALUE : Math.max(maxDuration, 0); }
}

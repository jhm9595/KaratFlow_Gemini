package com.minibig.karatflow.backend.config;

import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.jdbc.core.JdbcTemplate;
import lombok.extern.slf4j.Slf4j;
import java.util.List;
import java.util.Map;

@Slf4j
@Configuration
public class DatabaseCleanupConfig {

    @Bean
    public CommandLineRunner cleanupObsoleteColumns(JdbcTemplate jdbcTemplate) {
        return args -> {
            log.info("Checking and cleaning up obsolete H2 database columns...");
            
            String[] cleanupQueries = {
                // subcontract_tasks obsolete columns
                "ALTER TABLE subcontract_tasks ALTER COLUMN dispatched_weightg SET NULL",
                "ALTER TABLE subcontract_tasks DROP COLUMN IF EXISTS dispatched_weightg",
                "ALTER TABLE subcontract_tasks ALTER COLUMN received_weightg SET NULL",
                "ALTER TABLE subcontract_tasks DROP COLUMN IF EXISTS received_weightg",
                "ALTER TABLE subcontract_tasks ALTER COLUMN loss_weightg SET NULL",
                "ALTER TABLE subcontract_tasks DROP COLUMN IF EXISTS loss_weightg",
                "ALTER TABLE subcontract_tasks ALTER COLUMN agreed_laborfee SET NULL",
                "ALTER TABLE subcontract_tasks DROP COLUMN IF EXISTS agreed_laborfee",
                "ALTER TABLE subcontract_tasks ALTER COLUMN taskname SET NULL",
                "ALTER TABLE subcontract_tasks DROP COLUMN IF EXISTS taskname",
                "ALTER TABLE subcontract_tasks ALTER COLUMN subcontractorname SET NULL",
                "ALTER TABLE subcontract_tasks DROP COLUMN IF EXISTS subcontractorname",

                // work_orders obsolete columns
                "ALTER TABLE work_orders ALTER COLUMN orderitemid SET NULL",
                "ALTER TABLE work_orders DROP COLUMN IF EXISTS orderitemid",
                "ALTER TABLE work_orders ALTER COLUMN currentstage SET NULL",
                "ALTER TABLE work_orders DROP COLUMN IF EXISTS currentstage",

                // orders obsolete columns
                "ALTER TABLE orders ALTER COLUMN customername SET NULL",
                "ALTER TABLE orders DROP COLUMN IF EXISTS customername",
                "ALTER TABLE orders ALTER COLUMN customerphone SET NULL",
                "ALTER TABLE orders DROP COLUMN IF EXISTS customerphone",
                "ALTER TABLE orders ALTER COLUMN ordertype SET NULL",
                "ALTER TABLE orders DROP COLUMN IF EXISTS ordertype",
                "ALTER TABLE orders ALTER COLUMN finalconsumerprice SET NULL",
                "ALTER TABLE orders DROP COLUMN IF EXISTS finalconsumerprice",
                "ALTER TABLE orders ALTER COLUMN completedweightg SET NULL",
                "ALTER TABLE orders DROP COLUMN IF EXISTS completedweightg",
                "ALTER TABLE orders ALTER COLUMN stoneweightg SET NULL",
                "ALTER TABLE orders DROP COLUMN IF EXISTS stoneweightg",
                "ALTER TABLE orders ALTER COLUMN orderno SET NULL",
                "ALTER TABLE orders DROP COLUMN IF EXISTS orderno"
            };

            for (String query : cleanupQueries) {
                try {
                    jdbcTemplate.execute(query);
                    log.info("Executed schema cleanup: {}", query);
                } catch (Exception e) {
                    // Column might not exist or already cleaned up
                    log.debug("Schema cleanup query skipped or failed: {} - {}", query, e.getMessage());
                }
            }

            // Seed permanent DEMO User if not existing
            try {
                List<Map<String, Object>> demoUserList = jdbcTemplate.queryForList(
                        "SELECT id FROM users WHERE oauth_provider_id = 'demo_account' OR username = 'DEMO' LIMIT 1"
                );
                Long demoUserId;
                if (demoUserList.isEmpty()) {
                    jdbcTemplate.update(
                            "INSERT INTO users (oauth_provider_id, username, email, role, profile_image_url) " +
                            "VALUES ('demo_account', 'DEMO', 'demo@karatflow.com', 'ROLE_USER', NULL)"
                    );
                    List<Map<String, Object>> created = jdbcTemplate.queryForList(
                            "SELECT id FROM users WHERE oauth_provider_id = 'demo_account' LIMIT 1"
                    );
                    demoUserId = ((Number) created.get(0).get("id")).longValue();
                    log.info("Provisioned permanent DEMO user with ID: {}", demoUserId);
                } else {
                    demoUserId = ((Number) demoUserList.get(0).get("id")).longValue();
                    jdbcTemplate.update(
                            "UPDATE users SET oauth_provider_id = 'demo_account', username = 'DEMO', email = 'demo@karatflow.com' WHERE id = ?",
                            demoUserId
                    );
                    log.info("Existing DEMO user found with ID: {}", demoUserId);
                }

                // Integrity fix for work_orders #578 and #579 was executed successfully.
                // Keeping clean so subsequent restarts preserve user actions.
            } catch (Exception e) {
                log.warn("Notice during permanent DEMO user initialization: {}", e.getMessage());
            }
        };
    }

    @Bean
    public CommandLineRunner migrateOrderStatuses(JdbcTemplate jdbcTemplate) {
        return args -> {
            log.info("Starting OrderStatus normalization migration...");
            try {
                // 1. COMPLETED 일괄 정규화
                int completedUpdated = jdbcTemplate.update(
                        "UPDATE orders SET status = 'COMPLETED' " +
                        "WHERE UPPER(TRIM(status)) IN ('완료', '완성', 'DONE', 'COMPLETED')"
                );
                log.info("Migrated {} orders to COMPLETED status", completedUpdated);

                // 2. CANCELLED 일괄 정규화
                int cancelledUpdated = jdbcTemplate.update(
                        "UPDATE orders SET status = 'CANCELLED' " +
                        "WHERE UPPER(TRIM(status)) IN ('취소', 'CANCEL', 'CANCELLED')"
                );
                log.info("Migrated {} orders to CANCELLED status", cancelledUpdated);

                // 3. 그 외 NULL 또는 비표준 값은 PROCESSING으로 정규화
                int processingUpdated = jdbcTemplate.update(
                        "UPDATE orders SET status = 'PROCESSING' " +
                        "WHERE status IS NULL OR UPPER(TRIM(status)) NOT IN ('COMPLETED', 'CANCELLED')"
                );
                log.info("Migrated {} orders to PROCESSING status", processingUpdated);

                log.info("OrderStatus normalization migration completed successfully.");
            } catch (Exception e) {
                log.error("Failed during OrderStatus normalization migration: {}", e.getMessage(), e);
            }
        };
    }
}


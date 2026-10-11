package com.minibig.karatflow.backend.config;

import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.jdbc.core.JdbcTemplate;
import lombok.extern.slf4j.Slf4j;

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
        };
    }
}

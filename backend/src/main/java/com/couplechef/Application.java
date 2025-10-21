package com.couplechef;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;

@SpringBootApplication
@EntityScan(basePackages = {
        "com.couplechef.menu.model"       // ✅ 扫描实体类
})
@EnableJpaRepositories(basePackages = {
        "com.couplechef.menu.repository"  // ✅ 扫描 repository
})
public class Application {

    public static void main(String[] args) {
        System.out.println("🚀 Starting CoupleChef - Menu Module...");
        SpringApplication.run(Application.class, args);
        System.out.println("✅ Menu Module started successfully at http://localhost:8080/api/menu");
    }
}

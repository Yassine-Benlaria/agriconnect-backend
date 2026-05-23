import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1779527795963 implements MigrationInterface {
    name = 'InitialSchema1779527795963'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "commune" ("id" SERIAL NOT NULL, "name_latin" character varying NOT NULL, "name_arabic" character varying NOT NULL, "lat" numeric(9,6) NOT NULL, "lng" numeric(9,6) NOT NULL, "wilaya_id" integer NOT NULL, CONSTRAINT "PK_bc512eb8412b43c9dc6e2c9e683" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "wilaya" ("id" SERIAL NOT NULL, "name_latin" character varying NOT NULL, "name_arabic" character varying NOT NULL, "code" integer NOT NULL, CONSTRAINT "PK_ff2c45578bd6c580cdadbe47b42" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."farmer_profile_activity_type_enum" AS ENUM('VEGETABLES_FRUITS', 'DATES', 'LIVESTOCK', 'POULTRY')`);
        await queryRunner.query(`CREATE TABLE "farmer_profile" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "exact_address" character varying NOT NULL, "land_area" double precision, "activity_type" "public"."farmer_profile_activity_type_enum" NOT NULL, "user_id" uuid NOT NULL, "commune_id" integer NOT NULL, CONSTRAINT "REL_358fe88af885e5a259e99b2b10" UNIQUE ("user_id"), CONSTRAINT "PK_114f50c5cc263b5931b3c6fb7ac" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."deliverer_profile_vehicle_type_enum" AS ENUM('FOURGON', 'FOURGON_REFRIGERE', 'HARBIN', 'CAMION', 'CAMION_REFRIGERE', 'HILUX')`);
        await queryRunner.query(`CREATE TABLE "deliverer_profile" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "vehicle_type" "public"."deliverer_profile_vehicle_type_enum" NOT NULL, "matricule" character varying, "is_available" boolean NOT NULL DEFAULT true, "current_order_id" uuid, "user_id" uuid NOT NULL, CONSTRAINT "REL_1e92c9bbf964dd36274ae7eb8a" UNIQUE ("user_id"), CONSTRAINT "PK_6d289849a8c85f3a1e83466f434" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."user_role_enum" AS ENUM('FARMER', 'BUYER', 'DELIVERER', 'ADMIN')`);
        await queryRunner.query(`CREATE TABLE "user" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "fullname" character varying NOT NULL, "email" character varying NOT NULL, "phone_number" character varying NOT NULL, "password_hash" character varying NOT NULL, "refresh_token_hash" character varying, "role" "public"."user_role_enum" NOT NULL, "address" character varying, "avatar_url" character varying, "rating" numeric(3,2) NOT NULL DEFAULT '0', "rating_count" integer NOT NULL DEFAULT '0', "is_banned" boolean NOT NULL DEFAULT false, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "wilaya_id" integer NOT NULL, CONSTRAINT "UQ_e12875dfb3b1d92d7d7c5377e22" UNIQUE ("email"), CONSTRAINT "PK_cace4a159ff9f2512dd42373760" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "category" ("id" SERIAL NOT NULL, "name" character varying NOT NULL, "icon" character varying, CONSTRAINT "PK_9c4e4a89e3674fc9f382d733f03" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "product_image" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "url" character varying NOT NULL, "display_order" integer NOT NULL DEFAULT '0', "product_id" uuid NOT NULL, CONSTRAINT "PK_99d98a80f57857d51b5f63c8240" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "product" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "title" character varying NOT NULL, "description" text NOT NULL, "price" numeric(10,2) NOT NULL, "price_unit" character varying NOT NULL, "quantity" numeric(10,2) NOT NULL, "is_available" boolean NOT NULL DEFAULT true, "rating" numeric(3,2) NOT NULL DEFAULT '0', "rating_count" integer NOT NULL DEFAULT '0', "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "farmer_id" uuid NOT NULL, "category_id" integer NOT NULL, "commune_id" integer NOT NULL, "wilaya_id" integer NOT NULL, CONSTRAINT "PK_bebc9158e480b949565b4dc7a82" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_product_farmer" ON "product" ("farmer_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_product_category" ON "product" ("category_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_product_wilaya" ON "product" ("wilaya_id") `);
        await queryRunner.query(`CREATE TABLE "order_item" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "quantity" numeric(10,2) NOT NULL, "unit_price" numeric(10,2) NOT NULL, "subtotal" numeric(10,2) NOT NULL, "order_id" uuid NOT NULL, "product_id" uuid NOT NULL, CONSTRAINT "PK_d01158fe15b1ead5c26fd7f4e90" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."order_status_enum" AS ENUM('PENDING', 'REJECTED', 'AWAITING_BUYER_PICKUP', 'AWAITING_DELIVERER_ASSIGN', 'AWAITING_DELIVERER_PICKUP', 'IN_TRANSIT', 'COMPLETED')`);
        await queryRunner.query(`CREATE TYPE "public"."order_delivery_option_enum" AS ENUM('WITH_DELIVERY', 'WITHOUT_DELIVERY')`);
        await queryRunner.query(`CREATE TABLE "order" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "status" "public"."order_status_enum" NOT NULL DEFAULT 'PENDING', "delivery_option" "public"."order_delivery_option_enum" NOT NULL, "rejection_reason" text, "delivery_price" numeric(10,2), "total_price" numeric(10,2) NOT NULL, "distance_km" numeric(6,2), "farmer_confirmed_pickup" boolean NOT NULL DEFAULT false, "buyer_confirmed_pickup" boolean NOT NULL DEFAULT false, "deliverer_confirmed_pickup" boolean NOT NULL DEFAULT false, "buyer_confirmed_delivery" boolean NOT NULL DEFAULT false, "deliverer_confirmed_delivery" boolean NOT NULL DEFAULT false, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "buyer_id" uuid NOT NULL, "farmer_id" uuid NOT NULL, "deliverer_id" uuid, "buyer_commune_id" integer NOT NULL, "farmer_commune_id" integer NOT NULL, CONSTRAINT "PK_1031171c13130102495201e3e20" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_order_farmer" ON "order" ("farmer_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_order_buyer" ON "order" ("buyer_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_order_status" ON "order" ("status") `);
        await queryRunner.query(`CREATE TABLE "review" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "rating" integer NOT NULL, "comment" text, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "order_id" uuid NOT NULL, "reviewer_id" uuid NOT NULL, "farmer_id" uuid NOT NULL, CONSTRAINT "UQ_d816563052236db6adc852f90ee" UNIQUE ("order_id"), CONSTRAINT "REL_d816563052236db6adc852f90e" UNIQUE ("order_id"), CONSTRAINT "CHK_review_rating" CHECK ("rating" BETWEEN 1 AND 5), CONSTRAINT "PK_2e4299a343a81574217255c00ca" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "cart_item" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "quantity" numeric(10,2) NOT NULL, "cart_id" uuid NOT NULL, "product_id" uuid NOT NULL, CONSTRAINT "UQ_cart_item_cart_product" UNIQUE ("cart_id", "product_id"), CONSTRAINT "PK_bd94725aa84f8cf37632bcde997" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "cart" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "buyer_id" uuid NOT NULL, CONSTRAINT "UQ_e748a9330ce4ffa4c5d4a0e6c75" UNIQUE ("buyer_id"), CONSTRAINT "REL_e748a9330ce4ffa4c5d4a0e6c7" UNIQUE ("buyer_id"), CONSTRAINT "PK_c524ec48751b9b5bcfbf6e59be7" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "commune" ADD CONSTRAINT "FK_67db365d101c686311bc2d50da0" FOREIGN KEY ("wilaya_id") REFERENCES "wilaya"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "farmer_profile" ADD CONSTRAINT "FK_358fe88af885e5a259e99b2b102" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "farmer_profile" ADD CONSTRAINT "FK_7afa4708fc899cb6d823ea108cf" FOREIGN KEY ("commune_id") REFERENCES "commune"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "deliverer_profile" ADD CONSTRAINT "FK_1e92c9bbf964dd36274ae7eb8a7" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user" ADD CONSTRAINT "FK_17e358141781b314c31caa72ff2" FOREIGN KEY ("wilaya_id") REFERENCES "wilaya"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "product_image" ADD CONSTRAINT "FK_dbc7d9aa7ed42c9141b968a9ed3" FOREIGN KEY ("product_id") REFERENCES "product"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "product" ADD CONSTRAINT "FK_6f3de0c75c17d0c9a741018b769" FOREIGN KEY ("farmer_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "product" ADD CONSTRAINT "FK_0dce9bc93c2d2c399982d04bef1" FOREIGN KEY ("category_id") REFERENCES "category"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "product" ADD CONSTRAINT "FK_8930534aa08826f3e653076838e" FOREIGN KEY ("commune_id") REFERENCES "commune"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "product" ADD CONSTRAINT "FK_3b7ec5710151e22583d4bdfcfce" FOREIGN KEY ("wilaya_id") REFERENCES "wilaya"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "order_item" ADD CONSTRAINT "FK_e9674a6053adbaa1057848cddfa" FOREIGN KEY ("order_id") REFERENCES "order"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "order_item" ADD CONSTRAINT "FK_5e17c017aa3f5164cb2da5b1c6b" FOREIGN KEY ("product_id") REFERENCES "product"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "order" ADD CONSTRAINT "FK_8724877ec30a3aab629727b36ed" FOREIGN KEY ("buyer_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "order" ADD CONSTRAINT "FK_945ce155e7ddc04ef1e85ca8d00" FOREIGN KEY ("farmer_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "order" ADD CONSTRAINT "FK_a78cb2b65f4f39d2abf6b4ad879" FOREIGN KEY ("deliverer_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "order" ADD CONSTRAINT "FK_5598b1ff2e3544e49509004cc1c" FOREIGN KEY ("buyer_commune_id") REFERENCES "commune"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "order" ADD CONSTRAINT "FK_28864915ab3c35e9c38601dd416" FOREIGN KEY ("farmer_commune_id") REFERENCES "commune"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "review" ADD CONSTRAINT "FK_d816563052236db6adc852f90ee" FOREIGN KEY ("order_id") REFERENCES "order"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "review" ADD CONSTRAINT "FK_2f8adca6682f8238c64d767c9d3" FOREIGN KEY ("reviewer_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "review" ADD CONSTRAINT "FK_2f86903da71da1087119ec22a3c" FOREIGN KEY ("farmer_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "cart_item" ADD CONSTRAINT "FK_b6b2a4f1f533d89d218e70db941" FOREIGN KEY ("cart_id") REFERENCES "cart"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "cart_item" ADD CONSTRAINT "FK_67a2e8406e01ffa24ff9026944e" FOREIGN KEY ("product_id") REFERENCES "product"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "cart" ADD CONSTRAINT "FK_e748a9330ce4ffa4c5d4a0e6c75" FOREIGN KEY ("buyer_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "cart" DROP CONSTRAINT "FK_e748a9330ce4ffa4c5d4a0e6c75"`);
        await queryRunner.query(`ALTER TABLE "cart_item" DROP CONSTRAINT "FK_67a2e8406e01ffa24ff9026944e"`);
        await queryRunner.query(`ALTER TABLE "cart_item" DROP CONSTRAINT "FK_b6b2a4f1f533d89d218e70db941"`);
        await queryRunner.query(`ALTER TABLE "review" DROP CONSTRAINT "FK_2f86903da71da1087119ec22a3c"`);
        await queryRunner.query(`ALTER TABLE "review" DROP CONSTRAINT "FK_2f8adca6682f8238c64d767c9d3"`);
        await queryRunner.query(`ALTER TABLE "review" DROP CONSTRAINT "FK_d816563052236db6adc852f90ee"`);
        await queryRunner.query(`ALTER TABLE "order" DROP CONSTRAINT "FK_28864915ab3c35e9c38601dd416"`);
        await queryRunner.query(`ALTER TABLE "order" DROP CONSTRAINT "FK_5598b1ff2e3544e49509004cc1c"`);
        await queryRunner.query(`ALTER TABLE "order" DROP CONSTRAINT "FK_a78cb2b65f4f39d2abf6b4ad879"`);
        await queryRunner.query(`ALTER TABLE "order" DROP CONSTRAINT "FK_945ce155e7ddc04ef1e85ca8d00"`);
        await queryRunner.query(`ALTER TABLE "order" DROP CONSTRAINT "FK_8724877ec30a3aab629727b36ed"`);
        await queryRunner.query(`ALTER TABLE "order_item" DROP CONSTRAINT "FK_5e17c017aa3f5164cb2da5b1c6b"`);
        await queryRunner.query(`ALTER TABLE "order_item" DROP CONSTRAINT "FK_e9674a6053adbaa1057848cddfa"`);
        await queryRunner.query(`ALTER TABLE "product" DROP CONSTRAINT "FK_3b7ec5710151e22583d4bdfcfce"`);
        await queryRunner.query(`ALTER TABLE "product" DROP CONSTRAINT "FK_8930534aa08826f3e653076838e"`);
        await queryRunner.query(`ALTER TABLE "product" DROP CONSTRAINT "FK_0dce9bc93c2d2c399982d04bef1"`);
        await queryRunner.query(`ALTER TABLE "product" DROP CONSTRAINT "FK_6f3de0c75c17d0c9a741018b769"`);
        await queryRunner.query(`ALTER TABLE "product_image" DROP CONSTRAINT "FK_dbc7d9aa7ed42c9141b968a9ed3"`);
        await queryRunner.query(`ALTER TABLE "user" DROP CONSTRAINT "FK_17e358141781b314c31caa72ff2"`);
        await queryRunner.query(`ALTER TABLE "deliverer_profile" DROP CONSTRAINT "FK_1e92c9bbf964dd36274ae7eb8a7"`);
        await queryRunner.query(`ALTER TABLE "farmer_profile" DROP CONSTRAINT "FK_7afa4708fc899cb6d823ea108cf"`);
        await queryRunner.query(`ALTER TABLE "farmer_profile" DROP CONSTRAINT "FK_358fe88af885e5a259e99b2b102"`);
        await queryRunner.query(`ALTER TABLE "commune" DROP CONSTRAINT "FK_67db365d101c686311bc2d50da0"`);
        await queryRunner.query(`DROP TABLE "cart"`);
        await queryRunner.query(`DROP TABLE "cart_item"`);
        await queryRunner.query(`DROP TABLE "review"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_order_status"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_order_buyer"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_order_farmer"`);
        await queryRunner.query(`DROP TABLE "order"`);
        await queryRunner.query(`DROP TYPE "public"."order_delivery_option_enum"`);
        await queryRunner.query(`DROP TYPE "public"."order_status_enum"`);
        await queryRunner.query(`DROP TABLE "order_item"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_product_wilaya"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_product_category"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_product_farmer"`);
        await queryRunner.query(`DROP TABLE "product"`);
        await queryRunner.query(`DROP TABLE "product_image"`);
        await queryRunner.query(`DROP TABLE "category"`);
        await queryRunner.query(`DROP TABLE "user"`);
        await queryRunner.query(`DROP TYPE "public"."user_role_enum"`);
        await queryRunner.query(`DROP TABLE "deliverer_profile"`);
        await queryRunner.query(`DROP TYPE "public"."deliverer_profile_vehicle_type_enum"`);
        await queryRunner.query(`DROP TABLE "farmer_profile"`);
        await queryRunner.query(`DROP TYPE "public"."farmer_profile_activity_type_enum"`);
        await queryRunner.query(`DROP TABLE "wilaya"`);
        await queryRunner.query(`DROP TABLE "commune"`);
    }

}

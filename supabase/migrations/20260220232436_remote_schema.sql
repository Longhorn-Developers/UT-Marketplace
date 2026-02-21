

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE TYPE "public"."favorite_type" AS ENUM (
    'favorite',
    'watchlist'
);


ALTER TYPE "public"."favorite_type" OWNER TO "postgres";


CREATE TYPE "public"."listing_category" AS ENUM (
    'electronics',
    'furniture',
    'books',
    'clothing',
    'vehicles',
    'sports',
    'other',
    'tech',
    'textbooks',
    'subleases',
    'kitchen'
);


ALTER TYPE "public"."listing_category" OWNER TO "postgres";


CREATE TYPE "public"."listing_condition" AS ENUM (
    'new',
    'like_new',
    'good',
    'fair',
    'poor'
);


ALTER TYPE "public"."listing_condition" OWNER TO "postgres";


CREATE TYPE "public"."notification_type" AS ENUM (
    'message',
    'favorite',
    'watchlist',
    'listing_sold',
    'listing_inquiry',
    'rating',
    'system'
);


ALTER TYPE "public"."notification_type" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."cleanup_old_notifications"() RETURNS integer
    LANGUAGE "sql" SECURITY DEFINER
    AS $$
  WITH deleted AS (
    DELETE FROM user_notifications 
    WHERE created_at < NOW() - INTERVAL '30 days'
    RETURNING id
  )
  SELECT COUNT(*)::INTEGER FROM deleted;
$$;


ALTER FUNCTION "public"."cleanup_old_notifications"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_notification"("p_user_id" "uuid", "p_type" "public"."notification_type", "p_title" "text", "p_message" "text", "p_actor_id" "uuid" DEFAULT NULL::"uuid", "p_data" "jsonb" DEFAULT '{}'::"jsonb", "p_listing_id" "uuid" DEFAULT NULL::"uuid") RETURNS "uuid"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  notification_id UUID;
BEGIN
  INSERT INTO notifications (user_id, actor_id, type, title, message, data, listing_id)
  VALUES (p_user_id, p_actor_id, p_type, p_title, p_message, p_data, p_listing_id)
  RETURNING id INTO notification_id;
  
  RETURN notification_id;
END;
$$;


ALTER FUNCTION "public"."create_notification"("p_user_id" "uuid", "p_type" "public"."notification_type", "p_title" "text", "p_message" "text", "p_actor_id" "uuid", "p_data" "jsonb", "p_listing_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."ensure_user_profile"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  INSERT INTO public.users (id, email, display_name, created_at, updated_at)
  VALUES (
    NEW.id, 
    NEW.email, 
    COALESCE(
      NEW.raw_user_meta_data->>'display_name', 
      split_part(NEW.email, '@', 1)  -- Use email username as default
    ), 
    NOW(), 
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = NEW.email,
    display_name = COALESCE(
      NEW.raw_user_meta_data->>'display_name',
      split_part(NEW.email, '@', 1),
      users.display_name
    ),
    updated_at = NOW();
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."ensure_user_profile"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_listing_engagement_stats"("p_listing_id" "uuid") RETURNS TABLE("favorite_count" bigint, "watchlist_count" bigint)
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*) FILTER (WHERE type = 'favorite') as favorite_count,
    COUNT(*) FILTER (WHERE type = 'watchlist') as watchlist_count
  FROM user_favorites 
  WHERE listing_id = p_listing_id;
END;
$$;


ALTER FUNCTION "public"."get_listing_engagement_stats"("p_listing_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_or_create_conversation"("p_user1_id" "uuid", "p_user2_id" "uuid") RETURNS "uuid"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  RETURN get_or_create_conversation(p_user1_id, p_user2_id, NULL);
END;
$$;


ALTER FUNCTION "public"."get_or_create_conversation"("p_user1_id" "uuid", "p_user2_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_or_create_conversation"("p_user1_id" "uuid", "p_user2_id" "uuid", "p_listing_id" "uuid") RETURNS "uuid"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  conversation_id UUID;
  participant1_id UUID;
  participant2_id UUID;
BEGIN
  -- Ensure consistent ordering of participants
  IF p_user1_id < p_user2_id THEN
    participant1_id := p_user1_id;
    participant2_id := p_user2_id;
  ELSE
    participant1_id := p_user2_id;
    participant2_id := p_user1_id;
  END IF;

  -- Try to find existing conversation
  SELECT id INTO conversation_id
  FROM conversations
  WHERE participant_1_id = participant1_id 
    AND participant_2_id = participant2_id 
    AND (listing_id = p_listing_id OR (listing_id IS NULL AND p_listing_id IS NULL));

  -- If not found, create new conversation
  IF conversation_id IS NULL THEN
    INSERT INTO conversations (participant_1_id, participant_2_id, listing_id)
    VALUES (participant1_id, participant2_id, p_listing_id)
    RETURNING id INTO conversation_id;
  END IF;

  RETURN conversation_id;
END;
$$;


ALTER FUNCTION "public"."get_or_create_conversation"("p_user1_id" "uuid", "p_user2_id" "uuid", "p_listing_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_unread_notification_count"("p_user_id" "uuid") RETURNS integer
    LANGUAGE "sql" SECURITY DEFINER
    AS $$
  SELECT COUNT(*)::INTEGER 
  FROM user_notifications 
  WHERE user_id = p_user_id 
    AND is_read = FALSE;
$$;


ALTER FUNCTION "public"."get_unread_notification_count"("p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_user_by_email"("p_email" "text") RETURNS TABLE("id" "uuid", "email" "text", "display_name" "text", "profile_image_url" "text")
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  RETURN QUERY
  SELECT u.id, u.email, u.display_name, u.profile_image_url
  FROM users u
  WHERE u.email = p_email;
END;
$$;


ALTER FUNCTION "public"."get_user_by_email"("p_email" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_user_favorite_status"("p_user_id" "uuid", "p_listing_id" "uuid") RETURNS TABLE("is_favorited" boolean, "is_watchlisted" boolean)
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  RETURN QUERY
  SELECT 
    EXISTS(SELECT 1 FROM user_favorites WHERE user_id = p_user_id AND listing_id = p_listing_id AND type = 'favorite') as is_favorited,
    EXISTS(SELECT 1 FROM user_favorites WHERE user_id = p_user_id AND listing_id = p_listing_id AND type = 'watchlist') as is_watchlisted;
END;
$$;


ALTER FUNCTION "public"."get_user_favorite_status"("p_user_id" "uuid", "p_listing_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."mark_all_notifications_read"("p_user_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  UPDATE notifications
  SET is_read = true
  WHERE user_id = p_user_id AND is_read = false;
END;
$$;


ALTER FUNCTION "public"."mark_all_notifications_read"("p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."mark_all_user_notifications_read"("p_user_id" "uuid") RETURNS "void"
    LANGUAGE "sql" SECURITY DEFINER
    AS $$
  UPDATE user_notifications 
  SET is_read = TRUE, read_at = NOW()
  WHERE user_id = p_user_id 
    AND is_read = FALSE;
$$;


ALTER FUNCTION "public"."mark_all_user_notifications_read"("p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."sync_user_settings"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  -- When a user is inserted/updated in users table, sync to user_settings
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    INSERT INTO public.user_settings (email, display_name, profile_image_url, bio, phone, push_token, created_at, updated_at)
    VALUES (NEW.email, NEW.display_name, NEW.profile_image_url, NEW.bio, NEW.phone, NEW.push_token, NEW.created_at, NEW.updated_at)
    ON CONFLICT (email) DO UPDATE SET
      display_name = EXCLUDED.display_name,
      profile_image_url = EXCLUDED.profile_image_url,
      bio = EXCLUDED.bio,
      phone = EXCLUDED.phone,
      push_token = EXCLUDED.push_token,
      updated_at = EXCLUDED.updated_at;
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$;


ALTER FUNCTION "public"."sync_user_settings"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."toggle_user_favorite"("p_user_id" "uuid", "p_listing_id" "uuid", "p_type" "public"."favorite_type") RETURNS boolean
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  existing_record user_favorites%ROWTYPE;
  result BOOLEAN;
BEGIN
  -- Check if the record already exists
  SELECT * INTO existing_record
  FROM user_favorites
  WHERE user_id = p_user_id 
    AND listing_id = p_listing_id 
    AND type = p_type;

  IF FOUND THEN
    -- Record exists, remove it
    DELETE FROM user_favorites
    WHERE user_id = p_user_id 
      AND listing_id = p_listing_id 
      AND type = p_type;
    result := FALSE;
  ELSE
    -- Record doesn't exist, add it
    INSERT INTO user_favorites (user_id, listing_id, type)
    VALUES (p_user_id, p_listing_id, p_type);
    result := TRUE;
  END IF;

  RETURN result;
END;
$$;


ALTER FUNCTION "public"."toggle_user_favorite"("p_user_id" "uuid", "p_listing_id" "uuid", "p_type" "public"."favorite_type") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_listing_favorite_count"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.listings
    SET favorite_count = favorite_count + 1
    WHERE id = NEW.listing_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.listings
    SET favorite_count = favorite_count - 1
    WHERE id = OLD.listing_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;


ALTER FUNCTION "public"."update_listing_favorite_count"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_user_rating"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  UPDATE public.users
  SET 
    rating_average = (
      SELECT COALESCE(AVG(rating), 0)
      FROM public.reviews
      WHERE reviewed_id = NEW.reviewed_id
    ),
    rating_count = (
      SELECT COUNT(*)
      FROM public.reviews
      WHERE reviewed_id = NEW.reviewed_id
    )
  WHERE id = NEW.reviewed_id;
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_user_rating"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."conversations" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "participant_1_id" "uuid" NOT NULL,
    "participant_2_id" "uuid" NOT NULL,
    "listing_id" "uuid",
    "last_message_at" timestamp with time zone DEFAULT "now"(),
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."conversations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."listings" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "price" numeric(10,2),
    "category" "public"."listing_category" NOT NULL,
    "condition" "public"."listing_condition" NOT NULL,
    "images" "text"[] DEFAULT '{}'::"text"[],
    "location" "text",
    "location_lat" double precision,
    "location_lng" double precision,
    "is_sold" boolean DEFAULT false,
    "is_draft" boolean DEFAULT false,
    "is_featured" boolean DEFAULT false,
    "view_count" integer DEFAULT 0,
    "favorite_count" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "status" character varying(20) DEFAULT 'pending'::character varying,
    "denial_reason" "text",
    CONSTRAINT "listings_status_check" CHECK ((("status")::"text" = ANY ((ARRAY['pending'::character varying, 'approved'::character varying, 'denied'::character varying])::"text"[])))
);


ALTER TABLE "public"."listings" OWNER TO "postgres";


COMMENT ON COLUMN "public"."listings"."status" IS 'Listing approval status: pending, approved, or denied';



COMMENT ON COLUMN "public"."listings"."denial_reason" IS 'Reason for denial when status is denied';



CREATE TABLE IF NOT EXISTS "public"."users" (
    "id" "uuid" NOT NULL,
    "email" "text" NOT NULL,
    "display_name" "text",
    "bio" "text",
    "profile_image_url" "text",
    "phone" "text",
    "notification_preferences" "jsonb" DEFAULT '{"push_notifications": true, "email_notifications": true, "message_notifications": true, "favorite_notifications": true}'::"jsonb",
    "push_token" "text",
    "is_verified" boolean DEFAULT false,
    "rating_average" numeric(3,2) DEFAULT 0.00,
    "rating_count" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "is_admin" boolean DEFAULT false NOT NULL,
    "onboard_complete" boolean DEFAULT false
);


ALTER TABLE "public"."users" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."listing_details" AS
 SELECT "l"."id",
    "l"."user_id",
    "l"."title",
    "l"."description",
    "l"."price",
    "l"."category",
    "l"."condition",
    "l"."images",
    "l"."location",
    "l"."location_lat",
    "l"."location_lng",
    "l"."is_sold",
    "l"."is_draft",
    "l"."is_featured",
    "l"."view_count",
    "l"."favorite_count",
    "l"."created_at",
    "l"."updated_at",
        CASE
            WHEN (("u"."display_name" IS NOT NULL) AND (TRIM(BOTH FROM "u"."display_name") <> ''::"text")) THEN "u"."display_name"
            ELSE "split_part"("u"."email", '@'::"text", 1)
        END AS "user_name",
    "u"."profile_image_url" AS "user_image",
    "u"."email" AS "user_email",
    "u"."rating_average",
    "u"."rating_count"
   FROM ("public"."listings" "l"
     JOIN "public"."users" "u" ON (("l"."user_id" = "u"."id")));


ALTER VIEW "public"."listing_details" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."listing_reports" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "listing_id" "uuid" NOT NULL,
    "reporter_id" "uuid" NOT NULL,
    "reason" character varying(50) NOT NULL,
    "description" "text",
    "status" character varying(20) DEFAULT 'pending'::character varying,
    "created_at" timestamp without time zone DEFAULT "now"(),
    "reviewed_at" timestamp without time zone,
    "reviewed_by" "uuid",
    "admin_notes" "text",
    CONSTRAINT "listing_reports_status_check" CHECK ((("status")::"text" = ANY ((ARRAY['pending'::character varying, 'reviewed'::character varying, 'resolved'::character varying, 'dismissed'::character varying])::"text"[])))
);


ALTER TABLE "public"."listing_reports" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."messages" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "sender_id" "uuid" NOT NULL,
    "receiver_id" "uuid" NOT NULL,
    "listing_id" "uuid",
    "content" "text" NOT NULL,
    "is_read" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "encrypted_content" "text",
    "nonce" "text",
    "is_encrypted" boolean DEFAULT false
);


ALTER TABLE "public"."messages" OWNER TO "postgres";


COMMENT ON COLUMN "public"."messages"."encrypted_content" IS 'Base64-encoded ciphertext (TweetNaCl box)';



COMMENT ON COLUMN "public"."messages"."nonce" IS 'Base64-encoded nonce for decryption';



COMMENT ON COLUMN "public"."messages"."is_encrypted" IS 'Flag indicating whether message uses E2E encryption';



CREATE TABLE IF NOT EXISTS "public"."reviews" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "reviewer_id" "uuid" NOT NULL,
    "reviewed_id" "uuid" NOT NULL,
    "listing_id" "uuid",
    "rating" integer NOT NULL,
    "comment" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "reviews_rating_check" CHECK ((("rating" >= 1) AND ("rating" <= 5)))
);


ALTER TABLE "public"."reviews" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."terms_and_conditions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "title" character varying(255) NOT NULL,
    "content" "text" NOT NULL,
    "version" integer DEFAULT 1 NOT NULL,
    "last_updated" timestamp with time zone DEFAULT "now"(),
    "created_at" timestamp with time zone DEFAULT "now"(),
    "created_by" "uuid"
);


ALTER TABLE "public"."terms_and_conditions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_encryption_keys" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "public_key" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."user_encryption_keys" OWNER TO "postgres";


COMMENT ON TABLE "public"."user_encryption_keys" IS 'Stores public keys for end-to-end encryption. Private keys never leave user devices.';



COMMENT ON COLUMN "public"."user_encryption_keys"."public_key" IS 'Base64-encoded Curve25519 public key for message encryption';



CREATE TABLE IF NOT EXISTS "public"."user_favorites" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "listing_id" "uuid" NOT NULL,
    "type" "public"."favorite_type" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."user_favorites" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_keys" (
    "user_id" "uuid" NOT NULL,
    "public_key" "text" NOT NULL,
    "encrypted_private_key" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."user_keys" OWNER TO "postgres";


COMMENT ON TABLE "public"."user_keys" IS 'Contains relevant user keys.';



CREATE TABLE IF NOT EXISTS "public"."user_notifications" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "type" "text" NOT NULL,
    "title" "text" NOT NULL,
    "message" "text" NOT NULL,
    "data" "jsonb" DEFAULT '{}'::"jsonb",
    "actor_id" "uuid",
    "actor_name" "text",
    "listing_id" "uuid",
    "message_id" "uuid",
    "review_id" "uuid",
    "is_read" boolean DEFAULT false,
    "push_sent" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "read_at" timestamp with time zone,
    CONSTRAINT "user_notifications_type_check" CHECK (("type" = ANY (ARRAY['message'::"text", 'review'::"text", 'listing'::"text", 'system'::"text"]))),
    CONSTRAINT "user_notifications_user_id_created_at_idx" CHECK ((("user_id" IS NOT NULL) AND ("created_at" IS NOT NULL)))
);


ALTER TABLE "public"."user_notifications" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_reports" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "reported_user_id" "uuid" NOT NULL,
    "reporter_id" "uuid" NOT NULL,
    "reason" character varying(50) NOT NULL,
    "description" "text",
    "status" character varying(20) DEFAULT 'pending'::character varying,
    "created_at" timestamp without time zone DEFAULT "now"(),
    "reviewed_at" timestamp without time zone,
    "reviewed_by" "uuid",
    "admin_notes" "text",
    CONSTRAINT "user_reports_status_check" CHECK ((("status")::"text" = ANY ((ARRAY['pending'::character varying, 'reviewed'::character varying, 'resolved'::character varying, 'dismissed'::character varying])::"text"[])))
);


ALTER TABLE "public"."user_reports" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_settings" (
    "email" "text" NOT NULL,
    "display_name" "text",
    "profile_image_url" "text",
    "bio" "text",
    "phone" "text",
    "push_token" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."user_settings" OWNER TO "postgres";


ALTER TABLE ONLY "public"."conversations"
    ADD CONSTRAINT "conversations_participant_1_id_participant_2_id_listing_id_key" UNIQUE ("participant_1_id", "participant_2_id", "listing_id");



ALTER TABLE ONLY "public"."conversations"
    ADD CONSTRAINT "conversations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."listing_reports"
    ADD CONSTRAINT "listing_reports_listing_id_reporter_id_key" UNIQUE ("listing_id", "reporter_id");



ALTER TABLE ONLY "public"."listing_reports"
    ADD CONSTRAINT "listing_reports_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."listings"
    ADD CONSTRAINT "listings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."messages"
    ADD CONSTRAINT "messages_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."reviews"
    ADD CONSTRAINT "reviews_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."reviews"
    ADD CONSTRAINT "reviews_reviewer_id_reviewed_id_listing_id_key" UNIQUE ("reviewer_id", "reviewed_id", "listing_id");



ALTER TABLE ONLY "public"."terms_and_conditions"
    ADD CONSTRAINT "terms_and_conditions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_encryption_keys"
    ADD CONSTRAINT "user_encryption_keys_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_encryption_keys"
    ADD CONSTRAINT "user_encryption_keys_user_id_key" UNIQUE ("user_id");



ALTER TABLE ONLY "public"."user_favorites"
    ADD CONSTRAINT "user_favorites_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_favorites"
    ADD CONSTRAINT "user_favorites_user_id_listing_id_type_key" UNIQUE ("user_id", "listing_id", "type");



ALTER TABLE ONLY "public"."user_keys"
    ADD CONSTRAINT "user_keys_pkey" PRIMARY KEY ("user_id");



ALTER TABLE ONLY "public"."user_notifications"
    ADD CONSTRAINT "user_notifications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_reports"
    ADD CONSTRAINT "user_reports_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_reports"
    ADD CONSTRAINT "user_reports_reported_user_id_reporter_id_key" UNIQUE ("reported_user_id", "reporter_id");



ALTER TABLE ONLY "public"."user_settings"
    ADD CONSTRAINT "user_settings_pkey" PRIMARY KEY ("email");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_pkey" PRIMARY KEY ("id");



CREATE INDEX "idx_conversations_listing_id" ON "public"."conversations" USING "btree" ("listing_id");



CREATE INDEX "idx_conversations_participant_1" ON "public"."conversations" USING "btree" ("participant_1_id");



CREATE INDEX "idx_conversations_participant_2" ON "public"."conversations" USING "btree" ("participant_2_id");



CREATE INDEX "idx_listings_approved_not_sold" ON "public"."listings" USING "btree" ("status", "is_sold") WHERE ((("status")::"text" = 'approved'::"text") AND ("is_sold" = false));



CREATE INDEX "idx_listings_category" ON "public"."listings" USING "btree" ("category");



CREATE INDEX "idx_listings_created_at" ON "public"."listings" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_listings_is_sold" ON "public"."listings" USING "btree" ("is_sold");



CREATE INDEX "idx_listings_location" ON "public"."listings" USING "btree" ("location_lat", "location_lng");



CREATE INDEX "idx_listings_price" ON "public"."listings" USING "btree" ("price");



CREATE INDEX "idx_listings_status" ON "public"."listings" USING "btree" ("status");



CREATE INDEX "idx_listings_user_id" ON "public"."listings" USING "btree" ("user_id");



CREATE INDEX "idx_listings_user_status" ON "public"."listings" USING "btree" ("user_id", "status");



CREATE INDEX "idx_messages_created_at" ON "public"."messages" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_messages_is_encrypted" ON "public"."messages" USING "btree" ("is_encrypted");



CREATE INDEX "idx_messages_listing_id" ON "public"."messages" USING "btree" ("listing_id");



CREATE INDEX "idx_messages_receiver_id" ON "public"."messages" USING "btree" ("receiver_id");



CREATE INDEX "idx_messages_sender_id" ON "public"."messages" USING "btree" ("sender_id");



CREATE INDEX "idx_reviews_listing_id" ON "public"."reviews" USING "btree" ("listing_id");



CREATE INDEX "idx_reviews_reviewed_id" ON "public"."reviews" USING "btree" ("reviewed_id");



CREATE INDEX "idx_reviews_reviewer_id" ON "public"."reviews" USING "btree" ("reviewer_id");



CREATE INDEX "idx_terms_created_at" ON "public"."terms_and_conditions" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_terms_version" ON "public"."terms_and_conditions" USING "btree" ("version" DESC);



CREATE INDEX "idx_user_encryption_keys_user_id" ON "public"."user_encryption_keys" USING "btree" ("user_id");



CREATE INDEX "idx_user_favorites_listing_id" ON "public"."user_favorites" USING "btree" ("listing_id");



CREATE INDEX "idx_user_favorites_type" ON "public"."user_favorites" USING "btree" ("type");



CREATE INDEX "idx_user_favorites_user_id" ON "public"."user_favorites" USING "btree" ("user_id");



CREATE INDEX "idx_user_keys_user_id" ON "public"."user_keys" USING "btree" ("user_id");



CREATE INDEX "idx_user_notifications_unread" ON "public"."user_notifications" USING "btree" ("user_id") WHERE ("is_read" = false);



CREATE INDEX "idx_user_notifications_user_created" ON "public"."user_notifications" USING "btree" ("user_id", "created_at" DESC);



CREATE OR REPLACE TRIGGER "sync_user_settings_trigger" AFTER INSERT OR UPDATE ON "public"."users" FOR EACH ROW EXECUTE FUNCTION "public"."sync_user_settings"();



CREATE OR REPLACE TRIGGER "trigger_listings_updated_at" BEFORE UPDATE ON "public"."listings" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "trigger_update_listing_favorite_count" AFTER INSERT OR DELETE ON "public"."user_favorites" FOR EACH ROW EXECUTE FUNCTION "public"."update_listing_favorite_count"();



CREATE OR REPLACE TRIGGER "trigger_update_user_rating" AFTER INSERT OR UPDATE ON "public"."reviews" FOR EACH ROW EXECUTE FUNCTION "public"."update_user_rating"();



CREATE OR REPLACE TRIGGER "trigger_users_updated_at" BEFORE UPDATE ON "public"."users" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_user_encryption_keys_updated_at" BEFORE UPDATE ON "public"."user_encryption_keys" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



ALTER TABLE ONLY "public"."conversations"
    ADD CONSTRAINT "conversations_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "public"."listings"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."conversations"
    ADD CONSTRAINT "conversations_participant_1_id_fkey" FOREIGN KEY ("participant_1_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."conversations"
    ADD CONSTRAINT "conversations_participant_2_id_fkey" FOREIGN KEY ("participant_2_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."listing_reports"
    ADD CONSTRAINT "listing_reports_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "public"."listings"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."listing_reports"
    ADD CONSTRAINT "listing_reports_reporter_id_fkey" FOREIGN KEY ("reporter_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."listing_reports"
    ADD CONSTRAINT "listing_reports_reviewed_by_fkey" FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."listings"
    ADD CONSTRAINT "listings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."messages"
    ADD CONSTRAINT "messages_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "public"."listings"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."messages"
    ADD CONSTRAINT "messages_receiver_id_fkey" FOREIGN KEY ("receiver_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."messages"
    ADD CONSTRAINT "messages_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."reviews"
    ADD CONSTRAINT "reviews_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "public"."listings"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."reviews"
    ADD CONSTRAINT "reviews_reviewed_id_fkey" FOREIGN KEY ("reviewed_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."reviews"
    ADD CONSTRAINT "reviews_reviewer_id_fkey" FOREIGN KEY ("reviewer_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."terms_and_conditions"
    ADD CONSTRAINT "terms_and_conditions_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."user_encryption_keys"
    ADD CONSTRAINT "user_encryption_keys_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_favorites"
    ADD CONSTRAINT "user_favorites_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "public"."listings"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_favorites"
    ADD CONSTRAINT "user_favorites_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_keys"
    ADD CONSTRAINT "user_keys_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_notifications"
    ADD CONSTRAINT "user_notifications_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."user_notifications"
    ADD CONSTRAINT "user_notifications_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "public"."listings"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."user_notifications"
    ADD CONSTRAINT "user_notifications_message_id_fkey" FOREIGN KEY ("message_id") REFERENCES "public"."messages"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_notifications"
    ADD CONSTRAINT "user_notifications_review_id_fkey" FOREIGN KEY ("review_id") REFERENCES "public"."reviews"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_notifications"
    ADD CONSTRAINT "user_notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_reports"
    ADD CONSTRAINT "user_reports_reported_user_id_fkey" FOREIGN KEY ("reported_user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_reports"
    ADD CONSTRAINT "user_reports_reporter_id_fkey" FOREIGN KEY ("reporter_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_reports"
    ADD CONSTRAINT "user_reports_reviewed_by_fkey" FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



CREATE POLICY "Allow inserting notifications for any user" ON "public"."user_notifications" FOR INSERT WITH CHECK (true);



CREATE POLICY "Allow reading user keys" ON "public"."user_keys" FOR SELECT USING (true);



CREATE POLICY "Anyone can view published listings" ON "public"."listings" FOR SELECT USING ((NOT "is_draft"));



CREATE POLICY "Anyone can view reviews" ON "public"."reviews" FOR SELECT USING (true);



CREATE POLICY "Public keys are readable by all authenticated users" ON "public"."user_encryption_keys" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Users can create conversations" ON "public"."conversations" FOR INSERT WITH CHECK ((("auth"."uid"() = "participant_1_id") OR ("auth"."uid"() = "participant_2_id")));



CREATE POLICY "Users can create reviews" ON "public"."reviews" FOR INSERT WITH CHECK (("auth"."uid"() = "reviewer_id"));



CREATE POLICY "Users can delete only their own public key" ON "public"."user_encryption_keys" FOR DELETE TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete own favorites" ON "public"."user_favorites" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete own listings" ON "public"."listings" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete own reviews" ON "public"."reviews" FOR DELETE USING (("auth"."uid"() = "reviewer_id"));



CREATE POLICY "Users can delete their own notifications" ON "public"."user_notifications" FOR DELETE USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can insert own keys" ON "public"."user_keys" FOR INSERT WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can insert own listings" ON "public"."listings" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert own profile" ON "public"."users" FOR INSERT WITH CHECK (("auth"."uid"() = "id"));



CREATE POLICY "Users can insert their own public key" ON "public"."user_encryption_keys" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can manage own favorites" ON "public"."user_favorites" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can send messages" ON "public"."messages" FOR INSERT WITH CHECK (("auth"."uid"() = "sender_id"));



CREATE POLICY "Users can update only their own public key" ON "public"."user_encryption_keys" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update own favorites" ON "public"."user_favorites" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update own keys" ON "public"."user_keys" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update own listings" ON "public"."listings" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update own messages" ON "public"."messages" FOR UPDATE USING ((("auth"."uid"() = "sender_id") OR ("auth"."uid"() = "receiver_id")));



CREATE POLICY "Users can update own profile" ON "public"."users" FOR UPDATE USING (("auth"."uid"() = "id"));



CREATE POLICY "Users can update own reviews" ON "public"."reviews" FOR UPDATE USING (("auth"."uid"() = "reviewer_id"));



CREATE POLICY "Users can update their own notifications" ON "public"."user_notifications" FOR UPDATE USING (("user_id" = "auth"."uid"())) WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can view all users" ON "public"."users" FOR SELECT USING (true);



CREATE POLICY "Users can view own conversations" ON "public"."conversations" FOR SELECT USING ((("auth"."uid"() = "participant_1_id") OR ("auth"."uid"() = "participant_2_id")));



CREATE POLICY "Users can view own favorites" ON "public"."user_favorites" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view own listings" ON "public"."listings" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view own messages" ON "public"."messages" FOR SELECT USING ((("auth"."uid"() = "sender_id") OR ("auth"."uid"() = "receiver_id")));



CREATE POLICY "Users can view their own notifications" ON "public"."user_notifications" FOR SELECT USING (true);



CREATE POLICY "admin can edit" ON "public"."listings" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND ("users"."is_admin" = true))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND ("users"."is_admin" = true)))));



ALTER TABLE "public"."conversations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."listings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."messages" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."reviews" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_encryption_keys" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_favorites" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_keys" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_notifications" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."users" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";






GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";

























































































































































GRANT ALL ON FUNCTION "public"."cleanup_old_notifications"() TO "anon";
GRANT ALL ON FUNCTION "public"."cleanup_old_notifications"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."cleanup_old_notifications"() TO "service_role";



GRANT ALL ON FUNCTION "public"."create_notification"("p_user_id" "uuid", "p_type" "public"."notification_type", "p_title" "text", "p_message" "text", "p_actor_id" "uuid", "p_data" "jsonb", "p_listing_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."create_notification"("p_user_id" "uuid", "p_type" "public"."notification_type", "p_title" "text", "p_message" "text", "p_actor_id" "uuid", "p_data" "jsonb", "p_listing_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_notification"("p_user_id" "uuid", "p_type" "public"."notification_type", "p_title" "text", "p_message" "text", "p_actor_id" "uuid", "p_data" "jsonb", "p_listing_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."ensure_user_profile"() TO "anon";
GRANT ALL ON FUNCTION "public"."ensure_user_profile"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."ensure_user_profile"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_listing_engagement_stats"("p_listing_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_listing_engagement_stats"("p_listing_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_listing_engagement_stats"("p_listing_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_or_create_conversation"("p_user1_id" "uuid", "p_user2_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_or_create_conversation"("p_user1_id" "uuid", "p_user2_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_or_create_conversation"("p_user1_id" "uuid", "p_user2_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_or_create_conversation"("p_user1_id" "uuid", "p_user2_id" "uuid", "p_listing_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_or_create_conversation"("p_user1_id" "uuid", "p_user2_id" "uuid", "p_listing_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_or_create_conversation"("p_user1_id" "uuid", "p_user2_id" "uuid", "p_listing_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_unread_notification_count"("p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_unread_notification_count"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_unread_notification_count"("p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_user_by_email"("p_email" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_by_email"("p_email" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_by_email"("p_email" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_user_favorite_status"("p_user_id" "uuid", "p_listing_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_favorite_status"("p_user_id" "uuid", "p_listing_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_favorite_status"("p_user_id" "uuid", "p_listing_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."mark_all_notifications_read"("p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."mark_all_notifications_read"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."mark_all_notifications_read"("p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."mark_all_user_notifications_read"("p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."mark_all_user_notifications_read"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."mark_all_user_notifications_read"("p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."sync_user_settings"() TO "anon";
GRANT ALL ON FUNCTION "public"."sync_user_settings"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."sync_user_settings"() TO "service_role";



GRANT ALL ON FUNCTION "public"."toggle_user_favorite"("p_user_id" "uuid", "p_listing_id" "uuid", "p_type" "public"."favorite_type") TO "anon";
GRANT ALL ON FUNCTION "public"."toggle_user_favorite"("p_user_id" "uuid", "p_listing_id" "uuid", "p_type" "public"."favorite_type") TO "authenticated";
GRANT ALL ON FUNCTION "public"."toggle_user_favorite"("p_user_id" "uuid", "p_listing_id" "uuid", "p_type" "public"."favorite_type") TO "service_role";



GRANT ALL ON FUNCTION "public"."update_listing_favorite_count"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_listing_favorite_count"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_listing_favorite_count"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_user_rating"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_user_rating"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_user_rating"() TO "service_role";


















GRANT ALL ON TABLE "public"."conversations" TO "anon";
GRANT ALL ON TABLE "public"."conversations" TO "authenticated";
GRANT ALL ON TABLE "public"."conversations" TO "service_role";



GRANT ALL ON TABLE "public"."listings" TO "anon";
GRANT ALL ON TABLE "public"."listings" TO "authenticated";
GRANT ALL ON TABLE "public"."listings" TO "service_role";



GRANT ALL ON TABLE "public"."users" TO "anon";
GRANT ALL ON TABLE "public"."users" TO "authenticated";
GRANT ALL ON TABLE "public"."users" TO "service_role";



GRANT ALL ON TABLE "public"."listing_details" TO "anon";
GRANT ALL ON TABLE "public"."listing_details" TO "authenticated";
GRANT ALL ON TABLE "public"."listing_details" TO "service_role";



GRANT ALL ON TABLE "public"."listing_reports" TO "anon";
GRANT ALL ON TABLE "public"."listing_reports" TO "authenticated";
GRANT ALL ON TABLE "public"."listing_reports" TO "service_role";



GRANT ALL ON TABLE "public"."messages" TO "anon";
GRANT ALL ON TABLE "public"."messages" TO "authenticated";
GRANT ALL ON TABLE "public"."messages" TO "service_role";



GRANT ALL ON TABLE "public"."reviews" TO "anon";
GRANT ALL ON TABLE "public"."reviews" TO "authenticated";
GRANT ALL ON TABLE "public"."reviews" TO "service_role";



GRANT ALL ON TABLE "public"."terms_and_conditions" TO "anon";
GRANT ALL ON TABLE "public"."terms_and_conditions" TO "authenticated";
GRANT ALL ON TABLE "public"."terms_and_conditions" TO "service_role";



GRANT ALL ON TABLE "public"."user_encryption_keys" TO "anon";
GRANT ALL ON TABLE "public"."user_encryption_keys" TO "authenticated";
GRANT ALL ON TABLE "public"."user_encryption_keys" TO "service_role";



GRANT ALL ON TABLE "public"."user_favorites" TO "anon";
GRANT ALL ON TABLE "public"."user_favorites" TO "authenticated";
GRANT ALL ON TABLE "public"."user_favorites" TO "service_role";



GRANT ALL ON TABLE "public"."user_keys" TO "anon";
GRANT ALL ON TABLE "public"."user_keys" TO "authenticated";
GRANT ALL ON TABLE "public"."user_keys" TO "service_role";



GRANT ALL ON TABLE "public"."user_notifications" TO "anon";
GRANT ALL ON TABLE "public"."user_notifications" TO "authenticated";
GRANT ALL ON TABLE "public"."user_notifications" TO "service_role";



GRANT ALL ON TABLE "public"."user_reports" TO "anon";
GRANT ALL ON TABLE "public"."user_reports" TO "authenticated";
GRANT ALL ON TABLE "public"."user_reports" TO "service_role";



GRANT ALL ON TABLE "public"."user_settings" TO "anon";
GRANT ALL ON TABLE "public"."user_settings" TO "authenticated";
GRANT ALL ON TABLE "public"."user_settings" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";






























drop extension if exists "pg_net";

alter table "public"."listing_reports" drop constraint "listing_reports_status_check";

alter table "public"."listings" drop constraint "listings_status_check";

alter table "public"."user_reports" drop constraint "user_reports_status_check";

alter table "public"."listing_reports" add constraint "listing_reports_status_check" CHECK (((status)::text = ANY ((ARRAY['pending'::character varying, 'reviewed'::character varying, 'resolved'::character varying, 'dismissed'::character varying])::text[]))) not valid;

alter table "public"."listing_reports" validate constraint "listing_reports_status_check";

alter table "public"."listings" add constraint "listings_status_check" CHECK (((status)::text = ANY ((ARRAY['pending'::character varying, 'approved'::character varying, 'denied'::character varying])::text[]))) not valid;

alter table "public"."listings" validate constraint "listings_status_check";

alter table "public"."user_reports" add constraint "user_reports_status_check" CHECK (((status)::text = ANY ((ARRAY['pending'::character varying, 'reviewed'::character varying, 'resolved'::character varying, 'dismissed'::character varying])::text[]))) not valid;

alter table "public"."user_reports" validate constraint "user_reports_status_check";

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.ensure_user_profile();


  create policy "Allow authenticated users to upload avatars"
  on "storage"."objects"
  as permissive
  for insert
  to authenticated
with check ((bucket_id = 'avatars'::text));



  create policy "Allow authenticated users to upload listing images"
  on "storage"."objects"
  as permissive
  for insert
  to authenticated
with check ((bucket_id = 'listing-images'::text));



  create policy "Allow public access to avatars"
  on "storage"."objects"
  as permissive
  for select
  to public
using ((bucket_id = 'avatars'::text));



  create policy "Allow public access to listing images"
  on "storage"."objects"
  as permissive
  for select
  to public
using ((bucket_id = 'listing-images'::text));



  create policy "Allow users to delete own listing images"
  on "storage"."objects"
  as permissive
  for delete
  to authenticated
using (((bucket_id = 'listing-images'::text) AND ((auth.uid())::text = (storage.foldername(name))[1])));



  create policy "Allow users to update own avatars"
  on "storage"."objects"
  as permissive
  for update
  to authenticated
using (((bucket_id = 'avatars'::text) AND ((auth.uid())::text = (storage.foldername(name))[1])));




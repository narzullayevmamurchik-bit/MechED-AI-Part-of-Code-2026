export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      admin_activity_log: {
        Row: {
          action: string
          actor_id: string
          created_at: string
          entity_id: string | null
          entity_label: string | null
          entity_type: string
          id: string
          metadata: Json
        }
        Insert: {
          action: string
          actor_id: string
          created_at?: string
          entity_id?: string | null
          entity_label?: string | null
          entity_type: string
          id?: string
          metadata?: Json
        }
        Update: {
          action?: string
          actor_id?: string
          created_at?: string
          entity_id?: string | null
          entity_label?: string | null
          entity_type?: string
          id?: string
          metadata?: Json
        }
        Relationships: []
      }
      app_roles: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_system: boolean
          key: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_system?: boolean
          key: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_system?: boolean
          key?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      app_settings: {
        Row: {
          key: string
          updated_at: string
          updated_by: string | null
          value: Json
        }
        Insert: {
          key: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Update: {
          key?: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Relationships: []
      }
      application_events: {
        Row: {
          application_id: string
          created_at: string
          created_by: string | null
          id: string
          note: string | null
          status: Database["public"]["Enums"]["application_status"]
        }
        Insert: {
          application_id: string
          created_at?: string
          created_by?: string | null
          id?: string
          note?: string | null
          status: Database["public"]["Enums"]["application_status"]
        }
        Update: {
          application_id?: string
          created_at?: string
          created_by?: string | null
          id?: string
          note?: string | null
          status?: Database["public"]["Enums"]["application_status"]
        }
        Relationships: [
          {
            foreignKeyName: "application_events_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "job_applications"
            referencedColumns: ["id"]
          },
        ]
      }
      assignments: {
        Row: {
          assigned_at: string
          chapter_id: string | null
          course_id: string
          created_at: string
          created_by: string
          deadline: string | null
          description: string
          id: string
          max_score: number
          title: string
          updated_at: string
        }
        Insert: {
          assigned_at?: string
          chapter_id?: string | null
          course_id: string
          created_at?: string
          created_by: string
          deadline?: string | null
          description?: string
          id?: string
          max_score?: number
          title: string
          updated_at?: string
        }
        Update: {
          assigned_at?: string
          chapter_id?: string | null
          course_id?: string
          created_at?: string
          created_by?: string
          deadline?: string | null
          description?: string
          id?: string
          max_score?: number
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "assignments_chapter_id_fkey"
            columns: ["chapter_id"]
            isOneToOne: false
            referencedRelation: "chapters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assignments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      badges: {
        Row: {
          category: string
          code: string
          created_at: string
          criteria: Json
          description: string
          icon: string
          id: string
          name: string
          xp_reward: number
        }
        Insert: {
          category?: string
          code: string
          created_at?: string
          criteria?: Json
          description?: string
          icon?: string
          id?: string
          name: string
          xp_reward?: number
        }
        Update: {
          category?: string
          code?: string
          created_at?: string
          criteria?: Json
          description?: string
          icon?: string
          id?: string
          name?: string
          xp_reward?: number
        }
        Relationships: []
      }
      career_milestones: {
        Row: {
          badge_code: string | null
          description: string
          id: string
          slug: string
          stage_order: number
          title: string
          xp_reward: number
        }
        Insert: {
          badge_code?: string | null
          description?: string
          id?: string
          slug: string
          stage_order: number
          title: string
          xp_reward?: number
        }
        Update: {
          badge_code?: string | null
          description?: string
          id?: string
          slug?: string
          stage_order?: number
          title?: string
          xp_reward?: number
        }
        Relationships: []
      }
      chapters: {
        Row: {
          course_id: string
          created_at: string | null
          description: string | null
          id: string
          is_published: boolean
          sort_order: number | null
          title: string
          updated_at: string
        }
        Insert: {
          course_id: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_published?: boolean
          sort_order?: number | null
          title: string
          updated_at?: string
        }
        Update: {
          course_id?: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_published?: boolean
          sort_order?: number | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "chapters_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_messages: {
        Row: {
          created_at: string
          display_name: string | null
          id: string
          message: string
          user_id: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          id?: string
          message: string
          user_id: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          id?: string
          message?: string
          user_id?: string
        }
        Relationships: []
      }
      collab_files: {
        Row: {
          created_at: string
          file_name: string
          file_path: string
          id: string
          mime_type: string | null
          project_id: string
          size_bytes: number | null
          uploaded_by: string
        }
        Insert: {
          created_at?: string
          file_name: string
          file_path: string
          id?: string
          mime_type?: string | null
          project_id: string
          size_bytes?: number | null
          uploaded_by: string
        }
        Update: {
          created_at?: string
          file_name?: string
          file_path?: string
          id?: string
          mime_type?: string | null
          project_id?: string
          size_bytes?: number | null
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "collab_files_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "collab_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      collab_join_requests: {
        Row: {
          created_at: string
          decided_at: string | null
          decided_by: string | null
          desired_role: string | null
          id: string
          message: string | null
          project_id: string
          status: Database["public"]["Enums"]["collab_request_status"]
          user_id: string
        }
        Insert: {
          created_at?: string
          decided_at?: string | null
          decided_by?: string | null
          desired_role?: string | null
          id?: string
          message?: string | null
          project_id: string
          status?: Database["public"]["Enums"]["collab_request_status"]
          user_id: string
        }
        Update: {
          created_at?: string
          decided_at?: string | null
          decided_by?: string | null
          desired_role?: string | null
          id?: string
          message?: string | null
          project_id?: string
          status?: Database["public"]["Enums"]["collab_request_status"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "collab_join_requests_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "collab_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      collab_members: {
        Row: {
          id: string
          joined_at: string
          project_id: string
          role: Database["public"]["Enums"]["collab_member_role"]
          role_label: string | null
          user_id: string
        }
        Insert: {
          id?: string
          joined_at?: string
          project_id: string
          role?: Database["public"]["Enums"]["collab_member_role"]
          role_label?: string | null
          user_id: string
        }
        Update: {
          id?: string
          joined_at?: string
          project_id?: string
          role?: Database["public"]["Enums"]["collab_member_role"]
          role_label?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "collab_members_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "collab_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      collab_messages: {
        Row: {
          ai_flag_reason: string | null
          ai_flagged: boolean
          created_at: string
          display_name: string | null
          id: string
          message: string
          project_id: string
          user_id: string
        }
        Insert: {
          ai_flag_reason?: string | null
          ai_flagged?: boolean
          created_at?: string
          display_name?: string | null
          id?: string
          message: string
          project_id: string
          user_id: string
        }
        Update: {
          ai_flag_reason?: string | null
          ai_flagged?: boolean
          created_at?: string
          display_name?: string | null
          id?: string
          message?: string
          project_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "collab_messages_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "collab_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      collab_projects: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          country_focus: string | null
          created_at: string
          created_by: string
          description: string
          id: string
          max_team_size: number
          rejection_reason: string | null
          roles: string[]
          status: Database["public"]["Enums"]["collab_project_status"]
          title: string
          topic: string
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          country_focus?: string | null
          created_at?: string
          created_by: string
          description?: string
          id?: string
          max_team_size?: number
          rejection_reason?: string | null
          roles?: string[]
          status?: Database["public"]["Enums"]["collab_project_status"]
          title: string
          topic: string
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          country_focus?: string | null
          created_at?: string
          created_by?: string
          description?: string
          id?: string
          max_team_size?: number
          rejection_reason?: string | null
          roles?: string[]
          status?: Database["public"]["Enums"]["collab_project_status"]
          title?: string
          topic?: string
          updated_at?: string
        }
        Relationships: []
      }
      collab_tasks: {
        Row: {
          assignee_id: string | null
          created_at: string
          created_by: string
          description: string | null
          id: string
          project_id: string
          sort_order: number
          status: Database["public"]["Enums"]["collab_task_status"]
          title: string
          updated_at: string
        }
        Insert: {
          assignee_id?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          project_id: string
          sort_order?: number
          status?: Database["public"]["Enums"]["collab_task_status"]
          title: string
          updated_at?: string
        }
        Update: {
          assignee_id?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          project_id?: string
          sort_order?: number
          status?: Database["public"]["Enums"]["collab_task_status"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "collab_tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "collab_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          careers_url: string | null
          country: string | null
          created_at: string
          created_by: string | null
          description: string
          featured: boolean
          founded_year: number | null
          headquarters: string | null
          id: string
          industry: string
          logo_url: string | null
          name: string
          size: string | null
          slug: string | null
          updated_at: string
          website_url: string | null
        }
        Insert: {
          careers_url?: string | null
          country?: string | null
          created_at?: string
          created_by?: string | null
          description?: string
          featured?: boolean
          founded_year?: number | null
          headquarters?: string | null
          id?: string
          industry?: string
          logo_url?: string | null
          name: string
          size?: string | null
          slug?: string | null
          updated_at?: string
          website_url?: string | null
        }
        Update: {
          careers_url?: string | null
          country?: string | null
          created_at?: string
          created_by?: string | null
          description?: string
          featured?: boolean
          founded_year?: number | null
          headquarters?: string | null
          id?: string
          industry?: string
          logo_url?: string | null
          name?: string
          size?: string | null
          slug?: string | null
          updated_at?: string
          website_url?: string | null
        }
        Relationships: []
      }
      company_bookmarks: {
        Row: {
          company_id: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          company_id: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          company_id?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_bookmarks_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      company_employers: {
        Row: {
          company_id: string
          created_at: string
          id: string
          role_label: string | null
          user_id: string
        }
        Insert: {
          company_id: string
          created_at?: string
          id?: string
          role_label?: string | null
          user_id: string
        }
        Update: {
          company_id?: string
          created_at?: string
          id?: string
          role_label?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_employers_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          created_at: string
          id: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      course_teachers: {
        Row: {
          course_id: string
          created_at: string
          id: string
          teacher_id: string
        }
        Insert: {
          course_id: string
          created_at?: string
          id?: string
          teacher_id: string
        }
        Update: {
          course_id?: string
          created_at?: string
          id?: string
          teacher_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_teachers_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      courses: {
        Row: {
          created_at: string | null
          description: string | null
          duration: string | null
          estimated_hours: number | null
          field_id: string | null
          icon: string | null
          id: string
          is_ai_generated: boolean
          language: string | null
          learning_outcomes: string[] | null
          level: string | null
          published: boolean | null
          skills: string[] | null
          slug: string
          sort_order: number | null
          specialization_id: string | null
          status: Database["public"]["Enums"]["content_status"]
          thumbnail_url: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          duration?: string | null
          estimated_hours?: number | null
          field_id?: string | null
          icon?: string | null
          id?: string
          is_ai_generated?: boolean
          language?: string | null
          learning_outcomes?: string[] | null
          level?: string | null
          published?: boolean | null
          skills?: string[] | null
          slug: string
          sort_order?: number | null
          specialization_id?: string | null
          status?: Database["public"]["Enums"]["content_status"]
          thumbnail_url?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          duration?: string | null
          estimated_hours?: number | null
          field_id?: string | null
          icon?: string | null
          id?: string
          is_ai_generated?: boolean
          language?: string | null
          learning_outcomes?: string[] | null
          level?: string | null
          published?: boolean | null
          skills?: string[] | null
          slug?: string
          sort_order?: number | null
          specialization_id?: string | null
          status?: Database["public"]["Enums"]["content_status"]
          thumbnail_url?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "courses_field_id_fkey"
            columns: ["field_id"]
            isOneToOne: false
            referencedRelation: "engineering_fields"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "courses_specialization_id_fkey"
            columns: ["specialization_id"]
            isOneToOne: false
            referencedRelation: "specializations"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_activity: {
        Row: {
          activity_date: string
          id: string
          user_id: string
          xp_earned: number
        }
        Insert: {
          activity_date: string
          id?: string
          user_id: string
          xp_earned?: number
        }
        Update: {
          activity_date?: string
          id?: string
          user_id?: string
          xp_earned?: number
        }
        Relationships: []
      }
      daily_challenge_attempts: {
        Row: {
          challenge_date: string
          completed_at: string
          metadata: Json
          score: number
          user_id: string
          xp_awarded: number
        }
        Insert: {
          challenge_date: string
          completed_at?: string
          metadata?: Json
          score?: number
          user_id: string
          xp_awarded?: number
        }
        Update: {
          challenge_date?: string
          completed_at?: string
          metadata?: Json
          score?: number
          user_id?: string
          xp_awarded?: number
        }
        Relationships: []
      }
      daily_challenges: {
        Row: {
          challenge_date: string
          challenge_type: string
          created_at: string
          generated_by_ai: boolean
          payload: Json
          prompt: string
          xp_reward: number
        }
        Insert: {
          challenge_date: string
          challenge_type?: string
          created_at?: string
          generated_by_ai?: boolean
          payload?: Json
          prompt: string
          xp_reward?: number
        }
        Update: {
          challenge_date?: string
          challenge_type?: string
          created_at?: string
          generated_by_ai?: boolean
          payload?: Json
          prompt?: string
          xp_reward?: number
        }
        Relationships: []
      }
      engineering_fields: {
        Row: {
          created_at: string
          description: string | null
          icon: string | null
          id: string
          is_archived: boolean
          key: string
          name: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_archived?: boolean
          key: string
          name: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_archived?: boolean
          key?: string
          name?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      expert_answers: {
        Row: {
          attachments: Json
          author_id: string
          body: string
          created_at: string
          expert_id: string
          id: string
          is_ai_draft: boolean
          kb_comment_count: number
          kb_like_count: number
          kb_published: boolean
          kb_published_at: string | null
          kb_save_count: number
          kb_summary: string | null
          kb_tags: string[]
          kb_title: string | null
          kb_view_count: number
          question_id: string
          updated_at: string
        }
        Insert: {
          attachments?: Json
          author_id: string
          body: string
          created_at?: string
          expert_id: string
          id?: string
          is_ai_draft?: boolean
          kb_comment_count?: number
          kb_like_count?: number
          kb_published?: boolean
          kb_published_at?: string | null
          kb_save_count?: number
          kb_summary?: string | null
          kb_tags?: string[]
          kb_title?: string | null
          kb_view_count?: number
          question_id: string
          updated_at?: string
        }
        Update: {
          attachments?: Json
          author_id?: string
          body?: string
          created_at?: string
          expert_id?: string
          id?: string
          is_ai_draft?: boolean
          kb_comment_count?: number
          kb_like_count?: number
          kb_published?: boolean
          kb_published_at?: string | null
          kb_save_count?: number
          kb_summary?: string | null
          kb_tags?: string[]
          kb_title?: string | null
          kb_view_count?: number
          question_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "expert_answers_expert_id_fkey"
            columns: ["expert_id"]
            isOneToOne: false
            referencedRelation: "experts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expert_answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "expert_questions"
            referencedColumns: ["id"]
          },
        ]
      }
      expert_chat_messages: {
        Row: {
          attachment: Json | null
          body: string
          chat_id: string
          created_at: string
          id: string
          kind: string
          read_at: string | null
          sender_id: string
          sender_role: string
        }
        Insert: {
          attachment?: Json | null
          body?: string
          chat_id: string
          created_at?: string
          id?: string
          kind?: string
          read_at?: string | null
          sender_id: string
          sender_role: string
        }
        Update: {
          attachment?: Json | null
          body?: string
          chat_id?: string
          created_at?: string
          id?: string
          kind?: string
          read_at?: string | null
          sender_id?: string
          sender_role?: string
        }
        Relationships: [
          {
            foreignKeyName: "expert_chat_messages_chat_id_fkey"
            columns: ["chat_id"]
            isOneToOne: false
            referencedRelation: "expert_chats"
            referencedColumns: ["id"]
          },
        ]
      }
      expert_chat_typing: {
        Row: {
          chat_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          chat_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          chat_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "expert_chat_typing_chat_id_fkey"
            columns: ["chat_id"]
            isOneToOne: false
            referencedRelation: "expert_chats"
            referencedColumns: ["id"]
          },
        ]
      }
      expert_chats: {
        Row: {
          created_at: string
          expert_id: string
          expert_unread: number
          id: string
          last_message_at: string
          last_message_preview: string | null
          student_id: string
          student_unread: number
        }
        Insert: {
          created_at?: string
          expert_id: string
          expert_unread?: number
          id?: string
          last_message_at?: string
          last_message_preview?: string | null
          student_id: string
          student_unread?: number
        }
        Update: {
          created_at?: string
          expert_id?: string
          expert_unread?: number
          id?: string
          last_message_at?: string
          last_message_preview?: string | null
          student_id?: string
          student_unread?: number
        }
        Relationships: [
          {
            foreignKeyName: "expert_chats_expert_id_fkey"
            columns: ["expert_id"]
            isOneToOne: false
            referencedRelation: "experts"
            referencedColumns: ["id"]
          },
        ]
      }
      expert_followers: {
        Row: {
          created_at: string
          expert_id: string
          id: string
          student_id: string
        }
        Insert: {
          created_at?: string
          expert_id: string
          id?: string
          student_id: string
        }
        Update: {
          created_at?: string
          expert_id?: string
          id?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "expert_followers_expert_id_fkey"
            columns: ["expert_id"]
            isOneToOne: false
            referencedRelation: "experts"
            referencedColumns: ["id"]
          },
        ]
      }
      expert_question_likes: {
        Row: {
          created_at: string
          question_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          question_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          question_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "expert_question_likes_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "expert_questions"
            referencedColumns: ["id"]
          },
        ]
      }
      expert_questions: {
        Row: {
          attachments: Json
          body: string
          category: string
          created_at: string
          expert_id: string
          id: string
          is_public: boolean
          like_count: number
          priority: string
          status: string
          student_id: string
          title: string
          updated_at: string
        }
        Insert: {
          attachments?: Json
          body?: string
          category?: string
          created_at?: string
          expert_id: string
          id?: string
          is_public?: boolean
          like_count?: number
          priority?: string
          status?: string
          student_id: string
          title: string
          updated_at?: string
        }
        Update: {
          attachments?: Json
          body?: string
          category?: string
          created_at?: string
          expert_id?: string
          id?: string
          is_public?: boolean
          like_count?: number
          priority?: string
          status?: string
          student_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "expert_questions_expert_id_fkey"
            columns: ["expert_id"]
            isOneToOne: false
            referencedRelation: "experts"
            referencedColumns: ["id"]
          },
        ]
      }
      expert_specialization_links: {
        Row: {
          expert_id: string
          specialization_id: string
        }
        Insert: {
          expert_id: string
          specialization_id: string
        }
        Update: {
          expert_id?: string
          specialization_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "expert_specialization_links_expert_id_fkey"
            columns: ["expert_id"]
            isOneToOne: false
            referencedRelation: "experts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expert_specialization_links_specialization_id_fkey"
            columns: ["specialization_id"]
            isOneToOne: false
            referencedRelation: "expert_specializations"
            referencedColumns: ["id"]
          },
        ]
      }
      expert_specializations: {
        Row: {
          created_at: string
          description: string
          icon: string
          id: string
          name: string
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string
          icon?: string
          id?: string
          name: string
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string
          icon?: string
          id?: string
          name?: string
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      experts: {
        Row: {
          availability: string
          avatar: string
          bio: string
          created_at: string
          email: string | null
          experience_years: number | null
          id: string
          institution: string
          is_lead: boolean
          is_verified: boolean
          languages: string[]
          legacy_id: string | null
          name: string
          phone: string | null
          photo_url: string | null
          position: string
          publications: string[]
          rating_avg: number
          rating_count: number
          research_interests: string
          response_rate: number
          response_time_hours: number
          sort_order: number
          students_helped: number
          telegram: string | null
          title: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          availability?: string
          avatar?: string
          bio?: string
          created_at?: string
          email?: string | null
          experience_years?: number | null
          id?: string
          institution?: string
          is_lead?: boolean
          is_verified?: boolean
          languages?: string[]
          legacy_id?: string | null
          name: string
          phone?: string | null
          photo_url?: string | null
          position?: string
          publications?: string[]
          rating_avg?: number
          rating_count?: number
          research_interests?: string
          response_rate?: number
          response_time_hours?: number
          sort_order?: number
          students_helped?: number
          telegram?: string | null
          title?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          availability?: string
          avatar?: string
          bio?: string
          created_at?: string
          email?: string | null
          experience_years?: number | null
          id?: string
          institution?: string
          is_lead?: boolean
          is_verified?: boolean
          languages?: string[]
          legacy_id?: string | null
          name?: string
          phone?: string | null
          photo_url?: string | null
          position?: string
          publications?: string[]
          rating_avg?: number
          rating_count?: number
          research_interests?: string
          response_rate?: number
          response_time_hours?: number
          sort_order?: number
          students_helped?: number
          telegram?: string | null
          title?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      feedback: {
        Row: {
          category: string
          created_at: string
          id: string
          message: string
          user_id: string
        }
        Insert: {
          category?: string
          created_at?: string
          id?: string
          message: string
          user_id: string
        }
        Update: {
          category?: string
          created_at?: string
          id?: string
          message?: string
          user_id?: string
        }
        Relationships: []
      }
      game_definitions: {
        Row: {
          category: string
          created_at: string
          description: string
          difficulty: string
          icon: string
          id: string
          is_active: boolean
          name: string
          slug: string
          xp_per_play: number
        }
        Insert: {
          category: string
          created_at?: string
          description?: string
          difficulty?: string
          icon?: string
          id?: string
          is_active?: boolean
          name: string
          slug: string
          xp_per_play?: number
        }
        Update: {
          category?: string
          created_at?: string
          description?: string
          difficulty?: string
          icon?: string
          id?: string
          is_active?: boolean
          name?: string
          slug?: string
          xp_per_play?: number
        }
        Relationships: []
      }
      game_runs: {
        Row: {
          completed_at: string
          duration_s: number
          game_slug: string
          id: string
          metadata: Json
          score: number
          user_id: string
          xp_awarded: number
        }
        Insert: {
          completed_at?: string
          duration_s?: number
          game_slug: string
          id?: string
          metadata?: Json
          score?: number
          user_id: string
          xp_awarded?: number
        }
        Update: {
          completed_at?: string
          duration_s?: number
          game_slug?: string
          id?: string
          metadata?: Json
          score?: number
          user_id?: string
          xp_awarded?: number
        }
        Relationships: []
      }
      game_state: {
        Row: {
          game_slug: string
          state: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          game_slug: string
          state?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          game_slug?: string
          state?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      job_applications: {
        Row: {
          company_id: string
          cover_letter: string | null
          created_at: string
          id: string
          job_id: string
          resume_url: string | null
          status: Database["public"]["Enums"]["application_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          company_id: string
          cover_letter?: string | null
          created_at?: string
          id?: string
          job_id: string
          resume_url?: string | null
          status?: Database["public"]["Enums"]["application_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          company_id?: string
          cover_letter?: string | null
          created_at?: string
          id?: string
          job_id?: string
          resume_url?: string | null
          status?: Database["public"]["Enums"]["application_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      job_bookmarks: {
        Row: {
          created_at: string
          id: string
          job_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          job_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          job_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_bookmarks_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      jobs: {
        Row: {
          apply_url: string | null
          company_id: string
          created_at: string
          description: string
          expires_at: string | null
          external_source: string | null
          id: string
          location: string | null
          min_level: number
          posted_at: string
          posted_by: string | null
          remote: boolean
          required_skills: string[]
          status: Database["public"]["Enums"]["job_status"]
          title: string
          type: Database["public"]["Enums"]["job_type"]
          updated_at: string
        }
        Insert: {
          apply_url?: string | null
          company_id: string
          created_at?: string
          description?: string
          expires_at?: string | null
          external_source?: string | null
          id?: string
          location?: string | null
          min_level?: number
          posted_at?: string
          posted_by?: string | null
          remote?: boolean
          required_skills?: string[]
          status?: Database["public"]["Enums"]["job_status"]
          title: string
          type?: Database["public"]["Enums"]["job_type"]
          updated_at?: string
        }
        Update: {
          apply_url?: string | null
          company_id?: string
          created_at?: string
          description?: string
          expires_at?: string | null
          external_source?: string | null
          id?: string
          location?: string | null
          min_level?: number
          posted_at?: string
          posted_by?: string | null
          remote?: boolean
          required_skills?: string[]
          status?: Database["public"]["Enums"]["job_status"]
          title?: string
          type?: Database["public"]["Enums"]["job_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "jobs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      journal_match_runs: {
        Row: {
          abstract: string | null
          created_at: string
          id: string
          keywords: string[]
          result: Json
          title: string
          user_id: string
        }
        Insert: {
          abstract?: string | null
          created_at?: string
          id?: string
          keywords?: string[]
          result?: Json
          title: string
          user_id: string
        }
        Update: {
          abstract?: string | null
          created_at?: string
          id?: string
          keywords?: string[]
          result?: Json
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      journals: {
        Row: {
          abstract_max_words: number | null
          abstract_min_words: number | null
          acceptance_rate: number | null
          aims: string | null
          apc_amount: number | null
          apc_currency: string | null
          citation_style: string | null
          contact_email: string | null
          country: string | null
          created_at: string
          e_issn: string | null
          editor_info: string | null
          editorial_office: string | null
          figure_requirements: string | null
          formatting_guide: string | null
          id: string
          is_active: boolean
          is_doaj: boolean
          is_esci: boolean
          is_oak: boolean
          is_open_access: boolean
          is_scopus: boolean
          is_wos: boolean
          issn: string | null
          keywords: string[]
          languages: string[]
          max_pages: number | null
          name: string
          plagiarism_threshold: number | null
          publication_frequency: string | null
          publisher: string | null
          quartile: string | null
          region: string
          review_time_weeks: number | null
          risk_note: string | null
          risk_status: string
          scope: string | null
          subject_areas: string[]
          submission_url: string | null
          template_url: string | null
          updated_at: string
          website: string | null
        }
        Insert: {
          abstract_max_words?: number | null
          abstract_min_words?: number | null
          acceptance_rate?: number | null
          aims?: string | null
          apc_amount?: number | null
          apc_currency?: string | null
          citation_style?: string | null
          contact_email?: string | null
          country?: string | null
          created_at?: string
          e_issn?: string | null
          editor_info?: string | null
          editorial_office?: string | null
          figure_requirements?: string | null
          formatting_guide?: string | null
          id?: string
          is_active?: boolean
          is_doaj?: boolean
          is_esci?: boolean
          is_oak?: boolean
          is_open_access?: boolean
          is_scopus?: boolean
          is_wos?: boolean
          issn?: string | null
          keywords?: string[]
          languages?: string[]
          max_pages?: number | null
          name: string
          plagiarism_threshold?: number | null
          publication_frequency?: string | null
          publisher?: string | null
          quartile?: string | null
          region?: string
          review_time_weeks?: number | null
          risk_note?: string | null
          risk_status?: string
          scope?: string | null
          subject_areas?: string[]
          submission_url?: string | null
          template_url?: string | null
          updated_at?: string
          website?: string | null
        }
        Update: {
          abstract_max_words?: number | null
          abstract_min_words?: number | null
          acceptance_rate?: number | null
          aims?: string | null
          apc_amount?: number | null
          apc_currency?: string | null
          citation_style?: string | null
          contact_email?: string | null
          country?: string | null
          created_at?: string
          e_issn?: string | null
          editor_info?: string | null
          editorial_office?: string | null
          figure_requirements?: string | null
          formatting_guide?: string | null
          id?: string
          is_active?: boolean
          is_doaj?: boolean
          is_esci?: boolean
          is_oak?: boolean
          is_open_access?: boolean
          is_scopus?: boolean
          is_wos?: boolean
          issn?: string | null
          keywords?: string[]
          languages?: string[]
          max_pages?: number | null
          name?: string
          plagiarism_threshold?: number | null
          publication_frequency?: string | null
          publisher?: string | null
          quartile?: string | null
          region?: string
          review_time_weeks?: number | null
          risk_note?: string | null
          risk_status?: string
          scope?: string | null
          subject_areas?: string[]
          submission_url?: string | null
          template_url?: string | null
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
      kb_comments: {
        Row: {
          answer_id: string
          body: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          answer_id: string
          body: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          answer_id?: string
          body?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "kb_comments_answer_id_fkey"
            columns: ["answer_id"]
            isOneToOne: false
            referencedRelation: "expert_answers"
            referencedColumns: ["id"]
          },
        ]
      }
      kb_likes: {
        Row: {
          answer_id: string
          created_at: string
          user_id: string
        }
        Insert: {
          answer_id: string
          created_at?: string
          user_id: string
        }
        Update: {
          answer_id?: string
          created_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "kb_likes_answer_id_fkey"
            columns: ["answer_id"]
            isOneToOne: false
            referencedRelation: "expert_answers"
            referencedColumns: ["id"]
          },
        ]
      }
      kb_saves: {
        Row: {
          answer_id: string
          created_at: string
          user_id: string
        }
        Insert: {
          answer_id: string
          created_at?: string
          user_id: string
        }
        Update: {
          answer_id?: string
          created_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "kb_saves_answer_id_fkey"
            columns: ["answer_id"]
            isOneToOne: false
            referencedRelation: "expert_answers"
            referencedColumns: ["id"]
          },
        ]
      }
      lessons: {
        Row: {
          attachments: Json
          chapter_id: string
          content_md: string | null
          created_at: string | null
          duration: string | null
          id: string
          is_published: boolean
          pdf_url: string | null
          resources: Json
          sort_order: number | null
          summary: string | null
          title: string
          type: string
          updated_at: string
          video_url: string | null
          xp_reward: number
        }
        Insert: {
          attachments?: Json
          chapter_id: string
          content_md?: string | null
          created_at?: string | null
          duration?: string | null
          id?: string
          is_published?: boolean
          pdf_url?: string | null
          resources?: Json
          sort_order?: number | null
          summary?: string | null
          title: string
          type?: string
          updated_at?: string
          video_url?: string | null
          xp_reward?: number
        }
        Update: {
          attachments?: Json
          chapter_id?: string
          content_md?: string | null
          created_at?: string | null
          duration?: string | null
          id?: string
          is_published?: boolean
          pdf_url?: string | null
          resources?: Json
          sort_order?: number | null
          summary?: string | null
          title?: string
          type?: string
          updated_at?: string
          video_url?: string | null
          xp_reward?: number
        }
        Relationships: [
          {
            foreignKeyName: "lessons_chapter_id_fkey"
            columns: ["chapter_id"]
            isOneToOne: false
            referencedRelation: "chapters"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          role: Database["public"]["Enums"]["message_role"]
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["message_role"]
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["message_role"]
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      ocr_jobs: {
        Row: {
          attempts: number
          created_at: string
          detected_languages: string[]
          entity_id: string | null
          entity_type: string
          error: string | null
          id: string
          overall_confidence: number | null
          pages: Json
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          attempts?: number
          created_at?: string
          detected_languages?: string[]
          entity_id?: string | null
          entity_type: string
          error?: string | null
          id?: string
          overall_confidence?: number | null
          pages?: Json
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          attempts?: number
          created_at?: string
          detected_languages?: string[]
          entity_id?: string | null
          entity_type?: string
          error?: string | null
          id?: string
          overall_confidence?: number | null
          pages?: Json
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      permissions: {
        Row: {
          action: string
          description: string | null
          module: string
        }
        Insert: {
          action: string
          description?: string | null
          module: string
        }
        Update: {
          action?: string
          description?: string | null
          module?: string
        }
        Relationships: []
      }
      portfolio_projects: {
        Row: {
          created_at: string
          description: string
          end_date: string | null
          id: string
          image_url: string | null
          link_url: string | null
          outcomes: string | null
          role: string | null
          start_date: string | null
          tags: string[]
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string
          end_date?: string | null
          id?: string
          image_url?: string | null
          link_url?: string | null
          outcomes?: string | null
          role?: string | null
          start_date?: string | null
          tags?: string[]
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string
          end_date?: string | null
          id?: string
          image_url?: string | null
          link_url?: string | null
          outcomes?: string | null
          role?: string | null
          start_date?: string | null
          tags?: string[]
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          country: string | null
          created_at: string
          display_name: string | null
          github_url: string | null
          headline: string | null
          id: string
          linkedin_url: string | null
          manual_skills: string[]
          open_to_work: boolean
          portfolio_public: boolean
          portfolio_slug: string | null
          updated_at: string
          user_id: string
          website_url: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          country?: string | null
          created_at?: string
          display_name?: string | null
          github_url?: string | null
          headline?: string | null
          id?: string
          linkedin_url?: string | null
          manual_skills?: string[]
          open_to_work?: boolean
          portfolio_public?: boolean
          portfolio_slug?: string | null
          updated_at?: string
          user_id: string
          website_url?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          country?: string | null
          created_at?: string
          display_name?: string | null
          github_url?: string | null
          headline?: string | null
          id?: string
          linkedin_url?: string | null
          manual_skills?: string[]
          open_to_work?: boolean
          portfolio_public?: boolean
          portfolio_slug?: string | null
          updated_at?: string
          user_id?: string
          website_url?: string | null
        }
        Relationships: []
      }
      quiz_questions: {
        Row: {
          correct_idx: number
          created_at: string
          created_by: string | null
          difficulty: string
          explanation: string | null
          id: string
          options: Json
          question: string
          source: string
          topic: string
        }
        Insert: {
          correct_idx: number
          created_at?: string
          created_by?: string | null
          difficulty?: string
          explanation?: string | null
          id?: string
          options: Json
          question: string
          source?: string
          topic: string
        }
        Update: {
          correct_idx?: number
          created_at?: string
          created_by?: string | null
          difficulty?: string
          explanation?: string | null
          id?: string
          options?: Json
          question?: string
          source?: string
          topic?: string
        }
        Relationships: []
      }
      resource_bookmarks: {
        Row: {
          created_at: string
          id: string
          resource_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          resource_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          resource_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "resource_bookmarks_resource_id_fkey"
            columns: ["resource_id"]
            isOneToOne: false
            referencedRelation: "resources"
            referencedColumns: ["id"]
          },
        ]
      }
      resource_categories: {
        Row: {
          color: string
          created_at: string
          description: string
          icon: string
          id: string
          name: string
          parent_id: string | null
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          color?: string
          created_at?: string
          description?: string
          icon?: string
          id?: string
          name: string
          parent_id?: string | null
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          color?: string
          created_at?: string
          description?: string
          icon?: string
          id?: string
          name?: string
          parent_id?: string | null
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "resource_categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "resource_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      resource_category_links: {
        Row: {
          category_id: string
          resource_id: string
        }
        Insert: {
          category_id: string
          resource_id: string
        }
        Update: {
          category_id?: string
          resource_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "resource_category_links_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "resource_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resource_category_links_resource_id_fkey"
            columns: ["resource_id"]
            isOneToOne: false
            referencedRelation: "resources"
            referencedColumns: ["id"]
          },
        ]
      }
      resource_collection_items: {
        Row: {
          added_at: string
          collection_id: string
          resource_id: string
        }
        Insert: {
          added_at?: string
          collection_id: string
          resource_id: string
        }
        Update: {
          added_at?: string
          collection_id?: string
          resource_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "resource_collection_items_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "resource_collections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resource_collection_items_resource_id_fkey"
            columns: ["resource_id"]
            isOneToOne: false
            referencedRelation: "resources"
            referencedColumns: ["id"]
          },
        ]
      }
      resource_collections: {
        Row: {
          created_at: string
          description: string
          id: string
          is_public: boolean
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string
          id?: string
          is_public?: boolean
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          is_public?: boolean
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      resource_course_links: {
        Row: {
          chapter_id: string | null
          course_id: string | null
          created_at: string
          id: string
          lesson_id: string | null
          note: string | null
          resource_id: string
          sort_order: number
        }
        Insert: {
          chapter_id?: string | null
          course_id?: string | null
          created_at?: string
          id?: string
          lesson_id?: string | null
          note?: string | null
          resource_id: string
          sort_order?: number
        }
        Update: {
          chapter_id?: string | null
          course_id?: string | null
          created_at?: string
          id?: string
          lesson_id?: string | null
          note?: string | null
          resource_id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "resource_course_links_chapter_id_fkey"
            columns: ["chapter_id"]
            isOneToOne: false
            referencedRelation: "chapters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resource_course_links_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resource_course_links_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resource_course_links_resource_id_fkey"
            columns: ["resource_id"]
            isOneToOne: false
            referencedRelation: "resources"
            referencedColumns: ["id"]
          },
        ]
      }
      resource_downloads: {
        Row: {
          created_at: string
          id: string
          resource_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          resource_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          resource_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "resource_downloads_resource_id_fkey"
            columns: ["resource_id"]
            isOneToOne: false
            referencedRelation: "resources"
            referencedColumns: ["id"]
          },
        ]
      }
      resource_ratings: {
        Row: {
          created_at: string
          id: string
          rating: number
          resource_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          rating: number
          resource_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          rating?: number
          resource_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "resource_ratings_resource_id_fkey"
            columns: ["resource_id"]
            isOneToOne: false
            referencedRelation: "resources"
            referencedColumns: ["id"]
          },
        ]
      }
      resource_reading_progress: {
        Row: {
          last_position: string | null
          last_read_at: string
          progress_pct: number
          resource_id: string
          total_seconds: number
          user_id: string
        }
        Insert: {
          last_position?: string | null
          last_read_at?: string
          progress_pct?: number
          resource_id: string
          total_seconds?: number
          user_id: string
        }
        Update: {
          last_position?: string | null
          last_read_at?: string
          progress_pct?: number
          resource_id?: string
          total_seconds?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "resource_reading_progress_resource_id_fkey"
            columns: ["resource_id"]
            isOneToOne: false
            referencedRelation: "resources"
            referencedColumns: ["id"]
          },
        ]
      }
      resource_views: {
        Row: {
          id: string
          resource_id: string
          user_id: string | null
          viewed_at: string
        }
        Insert: {
          id?: string
          resource_id: string
          user_id?: string | null
          viewed_at?: string
        }
        Update: {
          id?: string
          resource_id?: string
          user_id?: string | null
          viewed_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "resource_views_resource_id_fkey"
            columns: ["resource_id"]
            isOneToOne: false
            referencedRelation: "resources"
            referencedColumns: ["id"]
          },
        ]
      }
      resources: {
        Row: {
          access_level: string
          access_type: string
          author: string | null
          authors: string[]
          category: string
          category_id: string | null
          cover_url: string | null
          created_at: string
          description: string
          difficulty: string
          doi: string | null
          download_count: number
          edition: string | null
          external_source_url: string | null
          field_id: string | null
          file_format: string | null
          file_path: string | null
          file_size_bytes: number | null
          id: string
          is_archived: boolean
          is_featured: boolean
          is_pinned: boolean
          is_recommended: boolean
          isbn: string | null
          language: string
          license: string | null
          publication_year: number | null
          publisher: string | null
          rating_avg: number
          rating_count: number
          rejection_reason: string | null
          resource_kind: string
          reviewed_at: string | null
          reviewed_by: string | null
          source: string | null
          specialization_id: string | null
          status: string
          submitted_by: string | null
          subtitle: string | null
          tags: string[]
          thumbnail_url: string | null
          title: string
          translated_titles: Json
          type: string
          updated_at: string
          url: string
          view_count: number
        }
        Insert: {
          access_level?: string
          access_type?: string
          author?: string | null
          authors?: string[]
          category?: string
          category_id?: string | null
          cover_url?: string | null
          created_at?: string
          description?: string
          difficulty?: string
          doi?: string | null
          download_count?: number
          edition?: string | null
          external_source_url?: string | null
          field_id?: string | null
          file_format?: string | null
          file_path?: string | null
          file_size_bytes?: number | null
          id?: string
          is_archived?: boolean
          is_featured?: boolean
          is_pinned?: boolean
          is_recommended?: boolean
          isbn?: string | null
          language?: string
          license?: string | null
          publication_year?: number | null
          publisher?: string | null
          rating_avg?: number
          rating_count?: number
          rejection_reason?: string | null
          resource_kind?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          source?: string | null
          specialization_id?: string | null
          status?: string
          submitted_by?: string | null
          subtitle?: string | null
          tags?: string[]
          thumbnail_url?: string | null
          title: string
          translated_titles?: Json
          type?: string
          updated_at?: string
          url?: string
          view_count?: number
        }
        Update: {
          access_level?: string
          access_type?: string
          author?: string | null
          authors?: string[]
          category?: string
          category_id?: string | null
          cover_url?: string | null
          created_at?: string
          description?: string
          difficulty?: string
          doi?: string | null
          download_count?: number
          edition?: string | null
          external_source_url?: string | null
          field_id?: string | null
          file_format?: string | null
          file_path?: string | null
          file_size_bytes?: number | null
          id?: string
          is_archived?: boolean
          is_featured?: boolean
          is_pinned?: boolean
          is_recommended?: boolean
          isbn?: string | null
          language?: string
          license?: string | null
          publication_year?: number | null
          publisher?: string | null
          rating_avg?: number
          rating_count?: number
          rejection_reason?: string | null
          resource_kind?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          source?: string | null
          specialization_id?: string | null
          status?: string
          submitted_by?: string | null
          subtitle?: string | null
          tags?: string[]
          thumbnail_url?: string | null
          title?: string
          translated_titles?: Json
          type?: string
          updated_at?: string
          url?: string
          view_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "resources_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "resource_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resources_field_id_fkey"
            columns: ["field_id"]
            isOneToOne: false
            referencedRelation: "engineering_fields"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resources_specialization_id_fkey"
            columns: ["specialization_id"]
            isOneToOne: false
            referencedRelation: "specializations"
            referencedColumns: ["id"]
          },
        ]
      }
      role_change_audit: {
        Row: {
          action: string
          changed_at: string
          changed_by: string
          id: string
          new_role: Database["public"]["Enums"]["app_role"]
          old_role: Database["public"]["Enums"]["app_role"] | null
          target_user_id: string
        }
        Insert: {
          action?: string
          changed_at?: string
          changed_by: string
          id?: string
          new_role: Database["public"]["Enums"]["app_role"]
          old_role?: Database["public"]["Enums"]["app_role"] | null
          target_user_id: string
        }
        Update: {
          action?: string
          changed_at?: string
          changed_by?: string
          id?: string
          new_role?: Database["public"]["Enums"]["app_role"]
          old_role?: Database["public"]["Enums"]["app_role"] | null
          target_user_id?: string
        }
        Relationships: []
      }
      role_permissions: {
        Row: {
          action: string
          granted_at: string
          module: string
          role_id: string
        }
        Insert: {
          action: string
          granted_at?: string
          module: string
          role_id: string
        }
        Update: {
          action?: string
          granted_at?: string
          module?: string
          role_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "role_permissions_module_action_fkey"
            columns: ["module", "action"]
            isOneToOne: false
            referencedRelation: "permissions"
            referencedColumns: ["module", "action"]
          },
          {
            foreignKeyName: "role_permissions_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "app_roles"
            referencedColumns: ["id"]
          },
        ]
      }
      scenario_decisions: {
        Row: {
          ai_feedback: string | null
          better_solution: string | null
          chosen_label: string | null
          chosen_option_id: string | null
          consequences: string | null
          created_at: string
          id: string
          is_correct: boolean | null
          points: number
          run_id: string
          step_index: number
          step_prompt: string | null
        }
        Insert: {
          ai_feedback?: string | null
          better_solution?: string | null
          chosen_label?: string | null
          chosen_option_id?: string | null
          consequences?: string | null
          created_at?: string
          id?: string
          is_correct?: boolean | null
          points?: number
          run_id: string
          step_index: number
          step_prompt?: string | null
        }
        Update: {
          ai_feedback?: string | null
          better_solution?: string | null
          chosen_label?: string | null
          chosen_option_id?: string | null
          consequences?: string | null
          created_at?: string
          id?: string
          is_correct?: boolean | null
          points?: number
          run_id?: string
          step_index?: number
          step_prompt?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "scenario_decisions_run_id_fkey"
            columns: ["run_id"]
            isOneToOne: false
            referencedRelation: "scenario_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      scenario_runs: {
        Row: {
          ai_insights: string[] | null
          ai_summary: string | null
          completed_at: string | null
          created_at: string
          id: string
          level: Database["public"]["Enums"]["scenario_level"]
          max_score: number
          scenario_id: string | null
          scenario_snapshot: Json | null
          score: number | null
          source: string
          started_at: string
          status: Database["public"]["Enums"]["scenario_run_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          ai_insights?: string[] | null
          ai_summary?: string | null
          completed_at?: string | null
          created_at?: string
          id?: string
          level?: Database["public"]["Enums"]["scenario_level"]
          max_score?: number
          scenario_id?: string | null
          scenario_snapshot?: Json | null
          score?: number | null
          source?: string
          started_at?: string
          status?: Database["public"]["Enums"]["scenario_run_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          ai_insights?: string[] | null
          ai_summary?: string | null
          completed_at?: string | null
          created_at?: string
          id?: string
          level?: Database["public"]["Enums"]["scenario_level"]
          max_score?: number
          scenario_id?: string | null
          scenario_snapshot?: Json | null
          score?: number | null
          source?: string
          started_at?: string
          status?: Database["public"]["Enums"]["scenario_run_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "scenario_runs_scenario_id_fkey"
            columns: ["scenario_id"]
            isOneToOne: false
            referencedRelation: "scenarios"
            referencedColumns: ["id"]
          },
        ]
      }
      scenarios: {
        Row: {
          context: string | null
          created_at: string
          created_by: string | null
          difficulty: Database["public"]["Enums"]["scenario_level"]
          domain: string
          estimated_minutes: number
          id: string
          is_ai_generated: boolean
          objectives: string[]
          problem_statement: string
          published: boolean
          role: string
          slug: string | null
          steps: Json
          success_criteria: string | null
          title: string
          updated_at: string
        }
        Insert: {
          context?: string | null
          created_at?: string
          created_by?: string | null
          difficulty?: Database["public"]["Enums"]["scenario_level"]
          domain?: string
          estimated_minutes?: number
          id?: string
          is_ai_generated?: boolean
          objectives?: string[]
          problem_statement: string
          published?: boolean
          role: string
          slug?: string | null
          steps?: Json
          success_criteria?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          context?: string | null
          created_at?: string
          created_by?: string | null
          difficulty?: Database["public"]["Enums"]["scenario_level"]
          domain?: string
          estimated_minutes?: number
          id?: string
          is_ai_generated?: boolean
          objectives?: string[]
          problem_statement?: string
          published?: boolean
          role?: string
          slug?: string | null
          steps?: Json
          success_criteria?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      self_checks: {
        Row: {
          ai_feedback: Json | null
          ai_score: number | null
          created_at: string
          file_name: string | null
          file_path: string | null
          file_size: number | null
          graded_at: string | null
          id: string
          notes: string | null
          ocr_confidence: number | null
          ocr_job_id: string | null
          ocr_languages: string[] | null
          ocr_text: string | null
          status: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          ai_feedback?: Json | null
          ai_score?: number | null
          created_at?: string
          file_name?: string | null
          file_path?: string | null
          file_size?: number | null
          graded_at?: string | null
          id?: string
          notes?: string | null
          ocr_confidence?: number | null
          ocr_job_id?: string | null
          ocr_languages?: string[] | null
          ocr_text?: string | null
          status?: string
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          ai_feedback?: Json | null
          ai_score?: number | null
          created_at?: string
          file_name?: string | null
          file_path?: string | null
          file_size?: number | null
          graded_at?: string | null
          id?: string
          notes?: string | null
          ocr_confidence?: number | null
          ocr_job_id?: string | null
          ocr_languages?: string[] | null
          ocr_text?: string | null
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "self_checks_ocr_job_id_fkey"
            columns: ["ocr_job_id"]
            isOneToOne: false
            referencedRelation: "ocr_jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      skill_gap_progress: {
        Row: {
          created_at: string
          id: string
          job_id: string
          note: string | null
          skill: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          job_id: string
          note?: string | null
          skill: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          job_id?: string
          note?: string | null
          skill?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      specializations: {
        Row: {
          created_at: string
          description: string | null
          field_id: string
          id: string
          is_archived: boolean
          key: string
          name: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          field_id: string
          id?: string
          is_archived?: boolean
          key: string
          name: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          field_id?: string
          id?: string
          is_archived?: boolean
          key?: string
          name?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "specializations_field_id_fkey"
            columns: ["field_id"]
            isOneToOne: false
            referencedRelation: "engineering_fields"
            referencedColumns: ["id"]
          },
        ]
      }
      submissions: {
        Row: {
          ai_feedback: Json | null
          ai_score: number | null
          assignment_id: string
          content: string | null
          created_at: string
          file_name: string | null
          file_path: string | null
          graded_at: string | null
          id: string
          ocr_confidence: number | null
          ocr_job_id: string | null
          ocr_languages: string[] | null
          ocr_text: string | null
          plagiarism_matches: Json | null
          plagiarism_score: number | null
          status: string
          student_id: string
          submitted_at: string
          teacher_feedback: string | null
          teacher_score: number | null
          updated_at: string
        }
        Insert: {
          ai_feedback?: Json | null
          ai_score?: number | null
          assignment_id: string
          content?: string | null
          created_at?: string
          file_name?: string | null
          file_path?: string | null
          graded_at?: string | null
          id?: string
          ocr_confidence?: number | null
          ocr_job_id?: string | null
          ocr_languages?: string[] | null
          ocr_text?: string | null
          plagiarism_matches?: Json | null
          plagiarism_score?: number | null
          status?: string
          student_id: string
          submitted_at?: string
          teacher_feedback?: string | null
          teacher_score?: number | null
          updated_at?: string
        }
        Update: {
          ai_feedback?: Json | null
          ai_score?: number | null
          assignment_id?: string
          content?: string | null
          created_at?: string
          file_name?: string | null
          file_path?: string | null
          graded_at?: string | null
          id?: string
          ocr_confidence?: number | null
          ocr_job_id?: string | null
          ocr_languages?: string[] | null
          ocr_text?: string | null
          plagiarism_matches?: Json | null
          plagiarism_score?: number | null
          status?: string
          student_id?: string
          submitted_at?: string
          teacher_feedback?: string | null
          teacher_score?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "submissions_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "assignments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "submissions_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "student_assignment_calendar"
            referencedColumns: ["assignment_id"]
          },
          {
            foreignKeyName: "submissions_ocr_job_id_fkey"
            columns: ["ocr_job_id"]
            isOneToOne: false
            referencedRelation: "ocr_jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      user_actions_log: {
        Row: {
          action: Database["public"]["Enums"]["moderation_action"]
          admin_id: string
          created_at: string
          id: string
          metadata: Json | null
          reason: string | null
          target_user_id: string
        }
        Insert: {
          action: Database["public"]["Enums"]["moderation_action"]
          admin_id: string
          created_at?: string
          id?: string
          metadata?: Json | null
          reason?: string | null
          target_user_id: string
        }
        Update: {
          action?: Database["public"]["Enums"]["moderation_action"]
          admin_id?: string
          created_at?: string
          id?: string
          metadata?: Json | null
          reason?: string | null
          target_user_id?: string
        }
        Relationships: []
      }
      user_activity: {
        Row: {
          activity_type: string
          created_at: string
          id: string
          item_id: string
          item_type: string
          tags: string[] | null
          user_id: string
        }
        Insert: {
          activity_type: string
          created_at?: string
          id?: string
          item_id: string
          item_type: string
          tags?: string[] | null
          user_id: string
        }
        Update: {
          activity_type?: string
          created_at?: string
          id?: string
          item_id?: string
          item_type?: string
          tags?: string[] | null
          user_id?: string
        }
        Relationships: []
      }
      user_badges: {
        Row: {
          badge_id: string
          id: string
          unlocked_at: string
          user_id: string
        }
        Insert: {
          badge_id: string
          id?: string
          unlocked_at?: string
          user_id: string
        }
        Update: {
          badge_id?: string
          id?: string
          unlocked_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_badges_badge_id_fkey"
            columns: ["badge_id"]
            isOneToOne: false
            referencedRelation: "badges"
            referencedColumns: ["id"]
          },
        ]
      }
      user_gamification: {
        Row: {
          contributor_xp: number
          current_streak: number
          engineer_xp: number
          last_active_date: string | null
          learner_xp: number
          level: number
          longest_streak: number
          total_xp: number
          updated_at: string
          user_id: string
        }
        Insert: {
          contributor_xp?: number
          current_streak?: number
          engineer_xp?: number
          last_active_date?: string | null
          learner_xp?: number
          level?: number
          longest_streak?: number
          total_xp?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          contributor_xp?: number
          current_streak?: number
          engineer_xp?: number
          last_active_date?: string | null
          learner_xp?: number
          level?: number
          longest_streak?: number
          total_xp?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_moderation: {
        Row: {
          deleted_at: string | null
          last_reason: string | null
          status: Database["public"]["Enums"]["user_status"]
          suspended_until: string | null
          updated_at: string
          updated_by: string | null
          user_id: string
          violation_count: number
        }
        Insert: {
          deleted_at?: string | null
          last_reason?: string | null
          status?: Database["public"]["Enums"]["user_status"]
          suspended_until?: string | null
          updated_at?: string
          updated_by?: string | null
          user_id: string
          violation_count?: number
        }
        Update: {
          deleted_at?: string | null
          last_reason?: string | null
          status?: Database["public"]["Enums"]["user_status"]
          suspended_until?: string | null
          updated_at?: string
          updated_by?: string | null
          user_id?: string
          violation_count?: number
        }
        Relationships: []
      }
      user_permission_overrides: {
        Row: {
          action: string
          created_at: string
          created_by: string | null
          effect: string
          expires_at: string | null
          id: string
          module: string
          reason: string | null
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string
          created_by?: string | null
          effect: string
          expires_at?: string | null
          id?: string
          module: string
          reason?: string | null
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string
          created_by?: string | null
          effect?: string
          expires_at?: string | null
          id?: string
          module?: string
          reason?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_permission_overrides_module_action_fkey"
            columns: ["module", "action"]
            isOneToOne: false
            referencedRelation: "permissions"
            referencedColumns: ["module", "action"]
          },
        ]
      }
      user_presence: {
        Row: {
          last_seen: string
          user_id: string
        }
        Insert: {
          last_seen?: string
          user_id: string
        }
        Update: {
          last_seen?: string
          user_id?: string
        }
        Relationships: []
      }
      user_progress: {
        Row: {
          completed: boolean
          completed_at: string
          id: string
          lesson_id: string
          user_id: string
        }
        Insert: {
          completed?: boolean
          completed_at?: string
          id?: string
          lesson_id: string
          user_id: string
        }
        Update: {
          completed?: boolean
          completed_at?: string
          id?: string
          lesson_id?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_roles_v2: {
        Row: {
          assigned_at: string
          assigned_by: string | null
          expires_at: string | null
          id: string
          role_id: string
          user_id: string
        }
        Insert: {
          assigned_at?: string
          assigned_by?: string | null
          expires_at?: string | null
          id?: string
          role_id: string
          user_id: string
        }
        Update: {
          assigned_at?: string
          assigned_by?: string | null
          expires_at?: string | null
          id?: string
          role_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_v2_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "app_roles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_skills: {
        Row: {
          evidence: Json
          id: string
          proficiency: string
          score: number
          skill: string
          source: string
          updated_at: string
          user_id: string
        }
        Insert: {
          evidence?: Json
          id?: string
          proficiency?: string
          score?: number
          skill: string
          source?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          evidence?: Json
          id?: string
          proficiency?: string
          score?: number
          skill?: string
          source?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_violations: {
        Row: {
          created_at: string
          details: string | null
          flagged_by: string
          id: string
          type: Database["public"]["Enums"]["violation_type"]
          user_id: string
        }
        Insert: {
          created_at?: string
          details?: string | null
          flagged_by: string
          id?: string
          type: Database["public"]["Enums"]["violation_type"]
          user_id: string
        }
        Update: {
          created_at?: string
          details?: string | null
          flagged_by?: string
          id?: string
          type?: Database["public"]["Enums"]["violation_type"]
          user_id?: string
        }
        Relationships: []
      }
      xp_transactions: {
        Row: {
          amount: number
          awarded_by: string | null
          category: Database["public"]["Enums"]["leaderboard_category"]
          created_at: string
          id: string
          reason: string | null
          source: Database["public"]["Enums"]["xp_source"]
          source_id: string | null
          user_id: string
        }
        Insert: {
          amount: number
          awarded_by?: string | null
          category?: Database["public"]["Enums"]["leaderboard_category"]
          created_at?: string
          id?: string
          reason?: string | null
          source: Database["public"]["Enums"]["xp_source"]
          source_id?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          awarded_by?: string | null
          category?: Database["public"]["Enums"]["leaderboard_category"]
          created_at?: string
          id?: string
          reason?: string | null
          source?: Database["public"]["Enums"]["xp_source"]
          source_id?: string | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      student_assignment_calendar: {
        Row: {
          ai_score: number | null
          assigned_at: string | null
          assignment_id: string | null
          course_icon: string | null
          course_id: string | null
          course_title: string | null
          deadline: string | null
          derived_status: string | null
          description: string | null
          max_score: number | null
          submission_id: string | null
          submission_status: string | null
          submitted_at: string | null
          teacher_score: number | null
          title: string | null
        }
        Relationships: [
          {
            foreignKeyName: "assignments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      admin_assign_role: {
        Args: { _expires_at?: string; _role_id: string; _user_id: string }
        Returns: undefined
      }
      admin_change_user_role: {
        Args: {
          _new_role: Database["public"]["Enums"]["app_role"]
          _target_user_id: string
        }
        Returns: undefined
      }
      admin_clear_user_override: {
        Args: { _action: string; _module: string; _user_id: string }
        Returns: undefined
      }
      admin_create_role: {
        Args: { _description?: string; _key: string; _name: string }
        Returns: string
      }
      admin_delete_role: { Args: { _role_id: string }; Returns: undefined }
      admin_demote_from_expert: {
        Args: { _user_id: string }
        Returns: undefined
      }
      admin_flag_user: {
        Args: {
          _details?: string
          _target_user_id: string
          _type: Database["public"]["Enums"]["violation_type"]
        }
        Returns: undefined
      }
      admin_hard_delete_user: {
        Args: { _reason?: string; _target_user_id: string }
        Returns: undefined
      }
      admin_list_permissions_for_user: {
        Args: { _user_id: string }
        Returns: {
          action: string
          module: string
          source: string
        }[]
      }
      admin_list_users: {
        Args: never
        Returns: {
          created_at: string
          deleted_at: string
          display_name: string
          email: string
          expert_id: string
          is_expert: boolean
          last_reason: string
          role: Database["public"]["Enums"]["app_role"]
          status: Database["public"]["Enums"]["user_status"]
          suspended_until: string
          user_id: string
          violation_count: number
        }[]
      }
      admin_moderate_user: {
        Args: {
          _action: Database["public"]["Enums"]["moderation_action"]
          _reason?: string
          _suspended_until?: string
          _target_user_id: string
        }
        Returns: undefined
      }
      admin_promote_to_expert: {
        Args: {
          _bio?: string
          _institution?: string
          _specialization_ids?: string[]
          _title?: string
          _user_id: string
        }
        Returns: string
      }
      admin_revoke_role: {
        Args: { _role_id: string; _user_id: string }
        Returns: undefined
      }
      admin_set_role_permission: {
        Args: {
          _action: string
          _enabled: boolean
          _module: string
          _role_id: string
        }
        Returns: undefined
      }
      admin_set_user_override: {
        Args: {
          _action: string
          _effect: string
          _expires_at?: string
          _module: string
          _reason?: string
          _user_id: string
        }
        Returns: undefined
      }
      admin_update_role: {
        Args: { _description: string; _name: string; _role_id: string }
        Returns: undefined
      }
      award_xp: {
        Args: {
          _amount: number
          _awarded_by?: string
          _category?: Database["public"]["Enums"]["leaderboard_category"]
          _dedupe?: boolean
          _reason?: string
          _source: Database["public"]["Enums"]["xp_source"]
          _source_id?: string
          _user_id: string
        }
        Returns: number
      }
      claim_daily_challenge: {
        Args: { _metadata?: Json; _score: number }
        Returns: Json
      }
      compute_level: { Args: { _xp: number }; Returns: number }
      get_expert_contact: {
        Args: { _expert_id: string }
        Returns: {
          email: string
          phone: string
          telegram: string
        }[]
      }
      get_game_leaderboard: {
        Args: { _limit?: number; _slug: string; _timeframe?: string }
        Returns: {
          avatar_url: string
          best_score: number
          display_name: string
          plays: number
          rank: number
          user_id: string
        }[]
      }
      get_leaderboard: {
        Args: {
          _category?: Database["public"]["Enums"]["leaderboard_category"]
          _limit?: number
          _timeframe?: string
        }
        Returns: {
          avatar_url: string
          display_name: string
          level: number
          rank: number
          user_id: string
          xp: number
        }[]
      }
      get_user_status: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["user_status"]
      }
      has_permission: {
        Args: { _action: string; _module: string; _user_id: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_any_expert: { Args: { _user_id: string }; Returns: boolean }
      is_collab_lead: {
        Args: { _project_id: string; _user_id: string }
        Returns: boolean
      }
      is_collab_member: {
        Args: { _project_id: string; _user_id: string }
        Returns: boolean
      }
      is_company_employer: {
        Args: { _company_id: string; _user_id: string }
        Returns: boolean
      }
      is_expert_user: {
        Args: { _expert_id: string; _user_id: string }
        Returns: boolean
      }
      is_teacher_of_course: {
        Args: { _course_id: string; _user_id: string }
        Returns: boolean
      }
      link_my_expert_profile: { Args: never; Returns: string }
      list_public_experts: {
        Args: never
        Returns: {
          availability: string
          avatar: string
          bio: string
          created_at: string
          experience_years: number
          id: string
          institution: string
          is_lead: boolean
          is_verified: boolean
          languages: string[]
          name: string
          photo_url: string
          position: string
          publications: string[]
          rating_avg: number
          rating_count: number
          research_interests: string
          response_rate: number
          response_time_hours: number
          sort_order: number
          students_helped: number
          title: string
          updated_at: string
        }[]
      }
      log_admin_activity: {
        Args: {
          _action: string
          _entity_id?: string
          _entity_label?: string
          _entity_type: string
          _metadata?: Json
        }
        Returns: string
      }
      record_daily_activity: {
        Args: { _user_id?: string }
        Returns: {
          awarded_xp: number
          current_streak: number
          longest_streak: number
        }[]
      }
      search_kb: {
        Args: {
          _limit?: number
          _offset?: number
          _q?: string
          _sort?: string
          _tags?: string[]
        }
        Returns: {
          body: string
          expert_avatar: string
          expert_id: string
          expert_name: string
          expert_photo_url: string
          expert_title: string
          id: string
          kb_comment_count: number
          kb_like_count: number
          kb_published_at: string
          kb_save_count: number
          kb_tags: string[]
          kb_title: string
          kb_view_count: number
          question_body: string
          question_category: string
          question_id: string
          question_title: string
        }[]
      }
      submit_game_run: {
        Args: {
          _duration_s?: number
          _metadata?: Json
          _score: number
          _slug: string
        }
        Returns: Json
      }
      unlock_badge: {
        Args: { _badge_code: string; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "teacher" | "student" | "editor" | "employer"
      application_status:
        | "applied"
        | "screening"
        | "interview"
        | "offer"
        | "rejected"
        | "withdrawn"
      collab_member_role: "lead" | "member" | "mentor"
      collab_project_status: "pending" | "approved" | "rejected" | "archived"
      collab_request_status: "pending" | "approved" | "declined"
      collab_task_status: "todo" | "doing" | "done"
      content_status: "draft" | "published" | "archived"
      job_status: "open" | "closed" | "draft"
      job_type:
        | "full_time"
        | "part_time"
        | "internship"
        | "research"
        | "contract"
      leaderboard_category: "learner" | "engineer" | "contributor" | "overall"
      message_role: "user" | "assistant"
      moderation_action:
        | "suspend"
        | "ban"
        | "delete"
        | "restore"
        | "flag"
        | "unflag"
        | "approve"
        | "block"
      scenario_level: "beginner" | "intermediate" | "advanced"
      scenario_run_status: "in_progress" | "completed" | "abandoned"
      user_status: "active" | "suspended" | "banned" | "pending"
      violation_type: "plagiarism" | "cheating" | "harassment" | "other"
      xp_source:
        | "lesson_complete"
        | "scenario_decision"
        | "scenario_complete"
        | "assignment_graded"
        | "collab_task_done"
        | "daily_streak"
        | "badge_unlock"
        | "admin_grant"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "teacher", "student", "editor", "employer"],
      application_status: [
        "applied",
        "screening",
        "interview",
        "offer",
        "rejected",
        "withdrawn",
      ],
      collab_member_role: ["lead", "member", "mentor"],
      collab_project_status: ["pending", "approved", "rejected", "archived"],
      collab_request_status: ["pending", "approved", "declined"],
      collab_task_status: ["todo", "doing", "done"],
      content_status: ["draft", "published", "archived"],
      job_status: ["open", "closed", "draft"],
      job_type: [
        "full_time",
        "part_time",
        "internship",
        "research",
        "contract",
      ],
      leaderboard_category: ["learner", "engineer", "contributor", "overall"],
      message_role: ["user", "assistant"],
      moderation_action: [
        "suspend",
        "ban",
        "delete",
        "restore",
        "flag",
        "unflag",
        "approve",
        "block",
      ],
      scenario_level: ["beginner", "intermediate", "advanced"],
      scenario_run_status: ["in_progress", "completed", "abandoned"],
      user_status: ["active", "suspended", "banned", "pending"],
      violation_type: ["plagiarism", "cheating", "harassment", "other"],
      xp_source: [
        "lesson_complete",
        "scenario_decision",
        "scenario_complete",
        "assignment_graded",
        "collab_task_done",
        "daily_streak",
        "badge_unlock",
        "admin_grant",
      ],
    },
  },
} as const

#!/bin/bash

# Notification System Setup Script
# This script helps you set up the complete notification system

set -e  # Exit on error

echo "🔔 Manzana Collection - Notification System Setup"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Step 1: Apply Database Triggers
echo -e "${BLUE}Step 1: Applying Database Triggers${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Choose installation method:"
echo "1) Automated (using apply-notification-triggers.js)"
echo "2) Manual (copy SQL to Supabase Dashboard)"
echo ""
read -p "Enter choice [1-2]: " trigger_choice

if [ "$trigger_choice" = "1" ]; then
    echo ""
    echo "Running automated trigger installation..."
    node apply-notification-triggers.js
    echo ""
    echo -e "${GREEN}✅ Triggers applied (check output above for any warnings)${NC}"
else
    echo ""
    echo -e "${YELLOW}📋 Manual Installation Steps:${NC}"
    echo "1. Go to: https://supabase.com/dashboard"
    echo "2. Select your project"
    echo "3. Navigate to: SQL Editor"
    echo "4. Click 'New Query'"
    echo "5. Copy contents of: add-notification-triggers.sql"
    echo "6. Paste and click 'Run'"
    echo ""
    read -p "Press Enter once you've completed these steps..."
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Step 2: Deploy Edge Function
echo -e "${BLUE}Step 2: Deploying Supabase Edge Function${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo -e "${YELLOW}⚠️  Supabase CLI not found${NC}"
    echo ""
    echo "Install it with:"
    echo "  npm install -g supabase"
    echo ""
    echo "Or follow: https://supabase.com/docs/guides/cli"
    echo ""
    read -p "Press Enter after installing Supabase CLI..."
fi

echo "Checking Supabase CLI..."
if command -v supabase &> /dev/null; then
    echo -e "${GREEN}✅ Supabase CLI is installed${NC}"
    echo ""

    # Check if already linked
    if [ -f ".supabase/config.toml" ]; then
        echo -e "${GREEN}✅ Project already linked${NC}"
    else
        echo "Project not linked yet."
        echo ""
        read -p "Enter your Supabase Project Reference (from Project Settings): " project_ref
        echo ""
        echo "Linking project..."
        supabase link --project-ref "$project_ref"
    fi

    echo ""
    echo "Preparing edge function..."

    # Create directory structure
    mkdir -p supabase/functions/send-push-notification

    # Copy edge function
    cp supabase-edge-function-send-push.ts supabase/functions/send-push-notification/index.ts

    echo -e "${GREEN}✅ Edge function files prepared${NC}"
    echo ""
    echo "Deploying edge function..."
    echo ""

    # Deploy
    supabase functions deploy send-push-notification --no-verify-jwt

    echo ""
    echo -e "${GREEN}✅ Edge function deployed!${NC}"
else
    echo -e "${RED}❌ Cannot deploy edge function without Supabase CLI${NC}"
    echo ""
    echo -e "${YELLOW}📋 Manual Edge Function Deployment:${NC}"
    echo "1. Install Supabase CLI: npm install -g supabase"
    echo "2. Login: supabase login"
    echo "3. Link project: supabase link --project-ref YOUR_PROJECT_REF"
    echo "4. Create dir: mkdir -p supabase/functions/send-push-notification"
    echo "5. Copy file: cp supabase-edge-function-send-push.ts supabase/functions/send-push-notification/index.ts"
    echo "6. Deploy: supabase functions deploy send-push-notification --no-verify-jwt"
    echo ""
    read -p "Press Enter once you've completed these steps..."
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Step 3: Create Webhook
echo -e "${BLUE}Step 3: Create Database Webhook${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "This step must be done manually in the Supabase Dashboard."
echo ""
echo -e "${YELLOW}📋 Webhook Configuration:${NC}"
echo ""
echo "1. Go to: Supabase Dashboard → Database → Webhooks"
echo "2. Click 'Create a new hook'"
echo "3. Configure:"
echo "   • Name: send_notification_on_insert"
echo "   • Table: notifications"
echo "   • Events: ✓ Insert"
echo "   • Type: HTTP Request"
echo "   • Method: POST"
echo "   • URL: https://YOUR_PROJECT_REF.supabase.co/functions/v1/send-push-notification"
echo "   • HTTP Headers:"
echo "     - Key: Authorization"
echo "     - Value: Bearer YOUR_SUPABASE_ANON_KEY"
echo "   • Timeout: 5000ms"
echo "4. Click 'Create Webhook'"
echo ""
echo "Find your:"
echo "  • PROJECT_REF: Project Settings → General → Reference ID"
echo "  • ANON_KEY: Project Settings → API → anon public"
echo ""
read -p "Press Enter once you've created the webhook..."

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Step 4: Summary
echo -e "${GREEN}🎉 Setup Complete!${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Your notification system should now be fully configured!"
echo ""
echo -e "${YELLOW}📝 Next Steps:${NC}"
echo "1. Rebuild your app:"
echo "   cd Manzana"
echo "   npm run ios    # or npm run android"
echo ""
echo "2. Test notifications:"
echo "   • Create a promotion and activate it"
echo "   • Set a stock alert and restock a product"
echo "   • Check Profile → Notifications in the app"
echo ""
echo "3. If issues occur, check:"
echo "   • Supabase Dashboard → Edge Functions → Logs"
echo "   • Supabase Dashboard → Database → Webhooks"
echo "   • App console logs"
echo ""
echo "For detailed testing instructions, see:"
echo "  NOTIFICATION_SETUP_GUIDE.md"
echo ""
echo -e "${GREEN}✅ All done!${NC}"
echo ""

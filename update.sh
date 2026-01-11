#!/bin/bash

echo "🚀 Mise à jour du Panel Roblox"
echo "=============================="
echo ""

# Couleurs pour la sortie
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Sauvegarde de la configuration
echo -e "${YELLOW}📦 Sauvegarde de la configuration...${NC}"
if [ -f "server/config.json" ]; then
    cp server/config.json server/config.json.backup
    echo -e "${GREEN}✓ Configuration sauvegardée${NC}"
else
    echo -e "${YELLOW}⚠ Aucune configuration à sauvegarder${NC}"
fi

# Git pull
echo ""
echo -e "${YELLOW}📥 Récupération des mises à jour...${NC}"
git fetch origin
git pull origin $(git branch --show-current)

if [ $? -ne 0 ]; then
    echo -e "${RED}✗ Erreur lors de la récupération des mises à jour${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Mises à jour récupérées${NC}"

# Restauration de la configuration
echo ""
if [ -f "server/config.json.backup" ]; then
    echo -e "${YELLOW}📦 Restauration de la configuration...${NC}"
    mv server/config.json.backup server/config.json
    echo -e "${GREEN}✓ Configuration restaurée${NC}"
fi

# Installation des dépendances
echo ""
echo -e "${YELLOW}📦 Installation des dépendances...${NC}"
npm install

cd server
npm install
cd ..

cd client
npm install
cd ..

echo -e "${GREEN}✓ Dépendances installées${NC}"

echo ""
echo -e "${GREEN}🎉 Mise à jour terminée avec succès !${NC}"
echo ""
echo "Pour démarrer l'application :"
echo "  npm run dev"
echo ""

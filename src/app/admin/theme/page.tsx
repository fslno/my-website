'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  Palette, 
  Layout, 
  Megaphone, 
  Type, 
  Save, 
  Monitor,
  Smartphone,
  Loader2,
  MousePointer2,
  ChevronRight,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Layers,
  Settings2,
  ShoppingBag,
  Search,
  FileText,
  Type as TypeIcon,
  CircleDot,
  PlusCircle,
  X,
  CreditCard,
  Terminal,
  Globe,
  Fingerprint,
  Construction
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';

const sportsFonts = [
  // --- Athletic & Impactful ---
  "Anton", "Bebas Neue", "Oswald", "Teko", "Kanit", 
  "Archivo Black", "Russo One", "Black Ops One", "Squada One", 
  "Racing Sans One", "Staatliches", "Big Shoulders Display", "Saira Stencil One",
  "Chakra Petch", "Rajdhani",

  // --- Modern & Clean E-commerce ---
  "Inter", "Montserrat", "Outfit", "Urbanist", "Plus Jakarta Sans", 
  "Public Sans", "Lexend", "Space Grotesk", "DM Sans", 
  "Host Grotesk", "Bricolage Grotesque", "Work Sans", "Jost",
  "Rubik", "Karla", "Poppins", "Manrope", "Quicksand", "Heebo", "Mulish",

  // --- Luxury & High-End Design ---
  "Syncopate", "Michroma", "Syne", "Unbounded", "Bodoni Moda", 
  "Cormorant Garamond", "Playfair Display", "Cinzel", "Tenor Sans", 
  "Italiana", "Fraunces", "Belleza", "Lora", "Marcellus", "Libre Baskerville",

  // --- Display & Technical ---
  "Space Mono", "Orbitron", "Righteous", "Stardos Stencil", 
  "Titillium Web", "Exo 2"
];

const DEFAULT_THEME = {
  primaryColor: '#000000',
  accentColor: '#FFFFFF',
  headlineFont: 'Anton',
  bodyFont: 'Inter',
  borderRadius: '0',
  bannerEnabled: true,
  bannerText: 'Free global shipping on orders over $500',
  bannerBgColor: '#000000',
  bannerFont: 'Inter',
  bannerFontSize: '10',
  homepageLayout: 'bento',
  categoryTextAlign: 'left',
  categoryVerticalAlign: 'center',
  categoryTitleSize: '40',
  categoryTitleColor: '#000000',
  categoryCardTextAlign: 'left',
  categoryCardVerticalAlign: 'bottom',
  categoryCardTitleSize: '24',
  categoryCardTitleColor: '#FFFFFF',
  archiveTextAlign: 'left',
  archiveTitleSize: '40',
  archiveTitleColor: '#000000',
  featuredTextAlign: 'left',
  featuredTitleSize: '40',
  featuredTitleColor: '#000000',
  productTitleSize: '14',
  productTitleColor: '#000000',
  productPriceSize: '14',
  productPriceColor: '#000000',
  productTextAlign: 'left',
  stickyHeader: true,
  adminPrimaryColor: '#000000',
  adminAccentColor: '#f6f6f7',
  adminTextColor: '#1a1c1e',
  adminBaseFontSize: '14',
  adminHeadlineFont: 'Inter',
  adminBodyFont: 'Inter',
  adminHeaderHeight: '64',
  adminSidebarBg: '#FFFFFF',
  adminSidebarHeaderSize: '10',
  adminSidebarHeaderColor: '#8c9196',
  adminSidebarItemSize: '14',
  adminSidebarItemColor: '#1a1c1e',
  adminSidebarActiveBg: '#000000',
  adminSidebarActiveText: '#FFFFFF',
  categorySectionTitle: 'Shop Jerseys',
  categorySectionSubtitle: 'Collections',
  archiveSectionTitle: 'All Teams',
  archiveSectionSubtitle: 'The Collection',
  showBrand: true,
  maintenanceMode: false,
  maintenanceMessage: 'Store Maintenance. We are currently updating the store. We will be back online shortly.',
  reviewBadgeSize: '1.0',
  reviewBadgeColor: '#000000',
  reviewBadgeTopDesktop: '80',
  reviewBadgeTopMobile: '60',
  reviewBadgeRight: '32',
  reviewBadgeVisibility: true,
  cardSkuSize: '9',
  cardSkuColor: '#8c9196',
  cardReviewScale: '1.0',
  cardReviewColor: '#8c9196',
  cardReviewPosition: 'below_sku',
  detailTitleSize: '48',
  detailTitleColor: '#000000',
  detailPriceSize: '30',
  detailPriceColor: '#000000',
  detailSkuSize: '9',
  detailSkuColor: '#8c9196',
  detailBrandSize: '9',
  detailBrandColor: '#000000',
  detailReviewScale: '1.0',
  detailReviewColor: '#000000',
  btnScale: '1.0',
  btnRadius: '4',
  btnBgColor: '#000000',
  btnHoverColor: '#DF1111',
  btnFontWeight: '500',
  btnTextTransform: 'none',
  btnBorderWidth: '0',
  btnPaddingX: '16',
  btnPaddingY: '8',
  heroHeadlineSize: '72',
  heroSubheadlineSize: '10',
  heroButtonText: 'Shop Now',
  heroButtonLink: '/products',
  heroButtonScale: '1.0',
  heroButtonRadius: '0',
  heroAspectRatioDesktop: '2.54'
};

export default function ThemeEnginePage() {
  const db = useFirestore();
  const { toast } = useToast();
  const [device, setDevice] = useState<'desktop' | 'mobile'>('desktop');
  const [isSaving, setIsSaving] = useState(false);

  const themeRef = useMemoFirebase(() => db ? doc(db, 'config', 'theme') : null, [db]);
  const { data: themeData, isLoading: loading } = useDoc(themeRef);

  // Form State - Storefront
  const [primaryColor, setPrimaryColor] = useState(DEFAULT_THEME.primaryColor);
  const [accentColor, setAccentColor] = useState(DEFAULT_THEME.accentColor);
  const [headlineFont, setHeadlineFont] = useState(DEFAULT_THEME.headlineFont);
  const [bodyFont, setBodyFont] = useState(DEFAULT_THEME.bodyFont);
  const [borderRadius, setBorderRadius] = useState(DEFAULT_THEME.borderRadius);
  const [bannerEnabled, setBannerEnabled] = useState(DEFAULT_THEME.bannerEnabled);
  const [bannerText, setBannerText] = useState(DEFAULT_THEME.bannerText);
  const [bannerBgColor, setBannerBgColor] = useState(DEFAULT_THEME.bannerBgColor);
  const [bannerFont, setBannerFont] = useState(DEFAULT_THEME.bannerFont);
  const [bannerFontSize, setBannerFontSize] = useState(DEFAULT_THEME.bannerFontSize);
  const [homepageLayout, setHomepageLayout] = useState(DEFAULT_THEME.homepageLayout);
  
  const [categoryTextAlign, setCategoryTextAlign] = useState(DEFAULT_THEME.categoryTextAlign);
  const [categoryVerticalAlign, setCategoryVerticalAlign] = useState(DEFAULT_THEME.categoryVerticalAlign);
  const [categoryTitleSize, setCategoryTitleSize] = useState(DEFAULT_THEME.categoryTitleSize);
  const [categoryTitleColor, setCategoryTitleColor] = useState(DEFAULT_THEME.categoryTitleColor);

  const [categoryCardTextAlign, setCategoryCardTextAlign] = useState(DEFAULT_THEME.categoryCardTextAlign);
  const [categoryCardVerticalAlign, setCategoryCardVerticalAlign] = useState(DEFAULT_THEME.categoryCardVerticalAlign);
  const [categoryCardTitleSize, setCategoryCardTitleSize] = useState(DEFAULT_THEME.categoryCardTitleSize);
  const [categoryCardTitleColor, setCategoryCardTitleColor] = useState(DEFAULT_THEME.categoryCardTitleColor);

  const [archiveTextAlign, setArchiveTextAlign] = useState(DEFAULT_THEME.archiveTextAlign);
  const [archiveTitleSize, setArchiveTitleSize] = useState(DEFAULT_THEME.archiveTitleSize);
  const [archiveTitleColor, setArchiveTitleColor] = useState(DEFAULT_THEME.archiveTitleColor);
  
  const [featuredTextAlign, setFeaturedTextAlign] = useState(DEFAULT_THEME.featuredTextAlign);
  const [featuredTitleSize, setFeaturedTitleSize] = useState(DEFAULT_THEME.featuredTitleSize);
  const [featuredTitleColor, setFeaturedTitleColor] = useState(DEFAULT_THEME.featuredTitleColor);
  
  const [productTitleSize, setProductTitleSize] = useState(DEFAULT_THEME.productTitleSize);
  const [productTitleColor, setProductTitleColor] = useState(DEFAULT_THEME.productTitleColor);
  const [productPriceSize, setProductPriceSize] = useState(DEFAULT_THEME.productPriceSize);
  const [productPriceColor, setProductPriceColor] = useState(DEFAULT_THEME.productPriceColor);
  const [productTextAlign, setProductTextAlign] = useState(DEFAULT_THEME.productTextAlign);
  const [stickyHeader, setStickyHeader] = useState(DEFAULT_THEME.stickyHeader);

  const [categorySectionTitle, setCategorySectionTitle] = useState(DEFAULT_THEME.categorySectionTitle);
  const [categorySectionSubtitle, setCategorySectionSubtitle] = useState(DEFAULT_THEME.categorySectionSubtitle);
  const [archiveSectionTitle, setArchiveSectionTitle] = useState(DEFAULT_THEME.archiveSectionTitle);
  const [archiveSectionSubtitle, setArchiveSectionSubtitle] = useState(DEFAULT_THEME.archiveSectionSubtitle);
  const [showBrand, setShowBrand] = useState(DEFAULT_THEME.showBrand);
  const [maintenanceMode, setMaintenanceMode] = useState(DEFAULT_THEME.maintenanceMode);
  const [maintenanceMessage, setMaintenanceMessage] = useState(DEFAULT_THEME.maintenanceMessage);

  // Review Badge Controls
  const [reviewBadgeSize, setReviewBadgeSize] = useState(DEFAULT_THEME.reviewBadgeSize);
  const [reviewBadgeColor, setReviewBadgeColor] = useState(DEFAULT_THEME.reviewBadgeColor);
  const [reviewBadgeTopDesktop, setReviewBadgeTopDesktop] = useState(DEFAULT_THEME.reviewBadgeTopDesktop);
  const [reviewBadgeTopMobile, setReviewBadgeTopMobile] = useState(DEFAULT_THEME.reviewBadgeTopMobile);
  const [reviewBadgeRight, setReviewBadgeRight] = useState(DEFAULT_THEME.reviewBadgeRight);
  const [reviewBadgeVisibility, setReviewBadgeVisibility] = useState(DEFAULT_THEME.reviewBadgeVisibility);

  // Product UI Controls
  const [cardSkuSize, setCardSkuSize] = useState(DEFAULT_THEME.cardSkuSize);
  const [cardSkuColor, setCardSkuColor] = useState(DEFAULT_THEME.cardSkuColor);
  const [cardReviewScale, setCardReviewScale] = useState(DEFAULT_THEME.cardReviewScale);
  const [cardReviewColor, setCardReviewColor] = useState(DEFAULT_THEME.cardReviewColor);
  const [cardReviewPosition, setCardReviewPosition] = useState(DEFAULT_THEME.cardReviewPosition);
  
  const [detailTitleSize, setDetailTitleSize] = useState(DEFAULT_THEME.detailTitleSize);
  const [detailTitleColor, setDetailTitleColor] = useState(DEFAULT_THEME.detailTitleColor);
  const [detailPriceSize, setDetailPriceSize] = useState(DEFAULT_THEME.detailPriceSize);
  const [detailPriceColor, setDetailPriceColor] = useState(DEFAULT_THEME.detailPriceColor);
  const [detailSkuSize, setDetailSkuSize] = useState(DEFAULT_THEME.detailSkuSize);
  const [detailSkuColor, setDetailSkuColor] = useState(DEFAULT_THEME.detailSkuColor);
  const [detailBrandSize, setDetailBrandSize] = useState(DEFAULT_THEME.detailBrandSize);
  const [detailBrandColor, setDetailBrandColor] = useState(DEFAULT_THEME.detailBrandColor);
  const [detailReviewScale, setDetailReviewScale] = useState(DEFAULT_THEME.detailReviewScale);
  const [detailReviewColor, setDetailReviewColor] = useState(DEFAULT_THEME.detailReviewColor);

  // Button UI Controls
  const [btnScale, setBtnScale] = useState(DEFAULT_THEME.btnScale);
  const [btnRadius, setBtnRadius] = useState(DEFAULT_THEME.btnRadius);
  const [btnBgColor, setBtnBgColor] = useState(DEFAULT_THEME.btnBgColor);
  const [btnHoverColor, setBtnHoverColor] = useState(DEFAULT_THEME.btnHoverColor);
  const [btnFontWeight, setBtnFontWeight] = useState(DEFAULT_THEME.btnFontWeight);
  const [btnTextTransform, setBtnTextTransform] = useState(DEFAULT_THEME.btnTextTransform);
  const [btnBorderWidth, setBtnBorderWidth] = useState(DEFAULT_THEME.btnBorderWidth);
  const [btnPaddingX, setBtnPaddingX] = useState(DEFAULT_THEME.btnPaddingX);
  const [btnPaddingY, setBtnPaddingY] = useState(DEFAULT_THEME.btnPaddingY);

  const [heroHeadlineSize, setHeroHeadlineSize] = useState(DEFAULT_THEME.heroHeadlineSize);
  const [heroSubheadlineSize, setHeroSubheadlineSize] = useState(DEFAULT_THEME.heroSubheadlineSize);
  const [heroButtonText, setHeroButtonText] = useState(DEFAULT_THEME.heroButtonText);
  const [heroButtonLink, setHeroButtonLink] = useState(DEFAULT_THEME.heroButtonLink);
  const [heroButtonScale, setHeroButtonScale] = useState(DEFAULT_THEME.heroButtonScale);
  const [heroButtonRadius, setHeroButtonRadius] = useState(DEFAULT_THEME.heroButtonRadius);
  const [heroAspectRatioDesktop, setHeroAspectRatioDesktop] = useState(DEFAULT_THEME.heroAspectRatioDesktop);

  // Form State - Admin
  const [adminPrimaryColor, setAdminPrimaryColor] = useState(DEFAULT_THEME.adminPrimaryColor);
  const [adminAccentColor, setAdminAccentColor] = useState(DEFAULT_THEME.adminAccentColor);
  const [adminTextColor, setAdminTextColor] = useState(DEFAULT_THEME.adminTextColor);
  const [adminBaseFontSize, setAdminBaseFontSize] = useState(DEFAULT_THEME.adminBaseFontSize);
  const [adminHeadlineFont, setAdminHeadlineFont] = useState(DEFAULT_THEME.adminHeadlineFont);
  const [adminBodyFont, setAdminBodyFont] = useState(DEFAULT_THEME.adminBodyFont);
  const [adminHeaderHeight, setAdminHeaderHeight] = useState(DEFAULT_THEME.adminHeaderHeight);
  const [adminSidebarBg, setAdminSidebarBg] = useState(DEFAULT_THEME.adminSidebarBg);
  const [adminSidebarHeaderSize, setAdminSidebarHeaderSize] = useState(DEFAULT_THEME.adminSidebarHeaderSize);
  const [adminSidebarHeaderColor, setAdminSidebarHeaderColor] = useState(DEFAULT_THEME.adminSidebarHeaderColor);
  const [adminSidebarItemSize, setAdminSidebarItemSize] = useState(DEFAULT_THEME.adminSidebarItemSize);
  const [adminSidebarItemColor, setAdminSidebarItemColor] = useState(DEFAULT_THEME.adminSidebarItemColor);
  const [adminSidebarActiveBg, setAdminSidebarActiveBg] = useState(DEFAULT_THEME.adminSidebarActiveBg);
  const [adminSidebarActiveText, setAdminSidebarActiveText] = useState(DEFAULT_THEME.adminSidebarActiveText);

  // Robust Google Fonts injection for Admin Selection Preview
  useEffect(() => {
    const fontId = 'admin-selection-fonts';
    let linkTag = document.getElementById(fontId) as HTMLLinkElement;
    
    const fontParams = sportsFonts.map(font => {
      const encoded = font.replace(/ /g, '+');
      return `family=${encoded}:wght@400;500;700`;
    }).join('&');

    const fontHref = `https://fonts.googleapis.com/css2?${fontParams}&display=swap`;

    if (!linkTag) {
      linkTag = document.createElement('link');
      linkTag.id = fontId;
      linkTag.rel = 'stylesheet';
      document.head.appendChild(linkTag);
    }
    
    if (linkTag.href !== fontHref) {
      linkTag.href = fontHref;
    }
  }, []);

  useEffect(() => {
    if (themeData) {
      setPrimaryColor(themeData.primaryColor || DEFAULT_THEME.primaryColor);
      setAccentColor(themeData.accentColor || DEFAULT_THEME.accentColor);
      setHeadlineFont(themeData.headlineFont || DEFAULT_THEME.headlineFont);
      setBodyFont(themeData.bodyFont || DEFAULT_THEME.bodyFont);
      setBorderRadius(themeData.borderRadius?.toString() || DEFAULT_THEME.borderRadius);
      setBannerEnabled(themeData.bannerEnabled ?? DEFAULT_THEME.bannerEnabled);
      setBannerText(themeData.bannerText || DEFAULT_THEME.bannerText);
      setBannerBgColor(themeData.bannerBgColor || DEFAULT_THEME.bannerBgColor);
      setBannerFont(themeData.bannerFont || DEFAULT_THEME.bannerFont);
      setBannerFontSize(themeData.bannerFontSize?.toString() || DEFAULT_THEME.bannerFontSize);
      setHomepageLayout(themeData.homepageLayout || DEFAULT_THEME.homepageLayout);
      setCategoryTextAlign(themeData.categoryTextAlign || DEFAULT_THEME.categoryTextAlign);
      setCategoryVerticalAlign(themeData.categoryVerticalAlign || DEFAULT_THEME.categoryVerticalAlign);
      setCategoryTitleSize(themeData.categoryTitleSize?.toString() || DEFAULT_THEME.categoryTitleSize);
      setCategoryTitleColor(themeData.categoryTitleColor || DEFAULT_THEME.categoryTitleColor);
      setCategoryCardTextAlign(themeData.categoryCardTextAlign || DEFAULT_THEME.categoryCardTextAlign);
      setCategoryCardVerticalAlign(themeData.categoryCardVerticalAlign || DEFAULT_THEME.categoryCardVerticalAlign);
      setCategoryCardTitleSize(themeData.categoryCardTitleSize?.toString() || DEFAULT_THEME.categoryCardTitleSize);
      setCategoryCardTitleColor(themeData.categoryCardTitleColor || DEFAULT_THEME.categoryCardTitleColor);
      setArchiveTextAlign(themeData.archiveTextAlign || DEFAULT_THEME.archiveTextAlign);
      setArchiveTitleSize(themeData.archiveTitleSize?.toString() || DEFAULT_THEME.archiveTitleSize);
      setArchiveTitleColor(themeData.archiveTitleColor || DEFAULT_THEME.archiveTitleColor);
      setFeaturedTextAlign(themeData.featuredTextAlign || DEFAULT_THEME.featuredTextAlign);
      setFeaturedTitleSize(themeData.featuredTitleSize?.toString() || DEFAULT_THEME.featuredTitleSize);
      setFeaturedTitleColor(themeData.featuredTitleColor || DEFAULT_THEME.featuredTitleColor);
      setProductTitleSize(themeData.productTitleSize?.toString() || DEFAULT_THEME.productTitleSize);
      setProductTitleColor(themeData.productTitleColor || DEFAULT_THEME.productTitleColor);
      setProductPriceSize(themeData.productPriceSize?.toString() || DEFAULT_THEME.productPriceSize);
      setProductPriceColor(themeData.productPriceColor || DEFAULT_THEME.productPriceColor);
      setProductTextAlign(themeData.productTextAlign || DEFAULT_THEME.productTextAlign);
      setStickyHeader(themeData.stickyHeader ?? DEFAULT_THEME.stickyHeader);
      setCategorySectionTitle(themeData.categorySectionTitle || DEFAULT_THEME.categorySectionTitle);
      setCategorySectionSubtitle(themeData.categorySectionSubtitle || DEFAULT_THEME.categorySectionSubtitle);
      setArchiveSectionTitle(themeData.archiveSectionTitle || DEFAULT_THEME.archiveSectionTitle);
      setArchiveSectionSubtitle(themeData.archiveSectionSubtitle || DEFAULT_THEME.archiveSectionSubtitle);
      setShowBrand(themeData.showBrand ?? DEFAULT_THEME.showBrand);
      setMaintenanceMode(themeData.maintenanceMode ?? DEFAULT_THEME.maintenanceMode);
      setMaintenanceMessage(themeData.maintenanceMessage || DEFAULT_THEME.maintenanceMessage);
      
      // Review Badge Sync
      setReviewBadgeSize(themeData.reviewBadgeSize?.toString() || DEFAULT_THEME.reviewBadgeSize);
      setReviewBadgeColor(themeData.reviewBadgeColor || DEFAULT_THEME.reviewBadgeColor);
      setReviewBadgeTopDesktop(themeData.reviewBadgeTopDesktop?.toString() || DEFAULT_THEME.reviewBadgeTopDesktop);
      setReviewBadgeTopMobile(themeData.reviewBadgeTopMobile?.toString() || DEFAULT_THEME.reviewBadgeTopMobile);
      setReviewBadgeRight(themeData.reviewBadgeRight?.toString() || DEFAULT_THEME.reviewBadgeRight);
      setReviewBadgeVisibility(themeData.reviewBadgeVisibility ?? DEFAULT_THEME.reviewBadgeVisibility);

      // Product UI Sync
      setCardSkuSize(themeData.cardSkuSize?.toString() || DEFAULT_THEME.cardSkuSize);
      setCardSkuColor(themeData.cardSkuColor || DEFAULT_THEME.cardSkuColor);
      setCardReviewScale(themeData.cardReviewScale?.toString() || DEFAULT_THEME.cardReviewScale);
      setCardReviewColor(themeData.cardReviewColor || DEFAULT_THEME.cardReviewColor);
      setCardReviewPosition(themeData.cardReviewPosition || DEFAULT_THEME.cardReviewPosition);
      
      setDetailTitleSize(themeData.detailTitleSize?.toString() || DEFAULT_THEME.detailTitleSize);
      setDetailTitleColor(themeData.detailTitleColor || DEFAULT_THEME.detailTitleColor);
      setDetailPriceSize(themeData.detailPriceSize?.toString() || DEFAULT_THEME.detailPriceSize);
      setDetailPriceColor(themeData.detailPriceColor || DEFAULT_THEME.detailPriceColor);
      setDetailSkuSize(themeData.detailSkuSize?.toString() || DEFAULT_THEME.detailSkuSize);
      setDetailSkuColor(themeData.detailSkuColor || DEFAULT_THEME.detailSkuColor);
      setDetailBrandSize(themeData.detailBrandSize?.toString() || DEFAULT_THEME.detailBrandSize);
      setDetailBrandColor(themeData.detailBrandColor || DEFAULT_THEME.detailBrandColor);
      setDetailReviewScale(themeData.detailReviewScale?.toString() || DEFAULT_THEME.detailReviewScale);
      setDetailReviewColor(themeData.detailReviewColor || DEFAULT_THEME.detailReviewColor);

      // Button UI Sync
      setBtnScale(themeData.btnScale?.toString() || DEFAULT_THEME.btnScale);
      setBtnRadius(themeData.btnRadius?.toString() || DEFAULT_THEME.btnRadius);
      setBtnBgColor(themeData.btnBgColor || DEFAULT_THEME.btnBgColor);
      setBtnHoverColor(themeData.btnHoverColor || DEFAULT_THEME.btnHoverColor);
      setBtnFontWeight(themeData.btnFontWeight?.toString() || DEFAULT_THEME.btnFontWeight);
      setBtnTextTransform(themeData.btnTextTransform || DEFAULT_THEME.btnTextTransform);
      setBtnBorderWidth(themeData.btnBorderWidth?.toString() || DEFAULT_THEME.btnBorderWidth);
      setBtnPaddingX(themeData.btnPaddingX?.toString() || DEFAULT_THEME.btnPaddingX);
      setBtnPaddingY(themeData.btnPaddingY?.toString() || DEFAULT_THEME.btnPaddingY);

      setHeroHeadlineSize(themeData.heroHeadlineSize?.toString() || DEFAULT_THEME.heroHeadlineSize);
      setHeroSubheadlineSize(themeData.heroSubheadlineSize?.toString() || DEFAULT_THEME.heroSubheadlineSize);
      setHeroButtonText(themeData.heroButtonText || DEFAULT_THEME.heroButtonText);
      setHeroButtonLink(themeData.heroButtonLink || DEFAULT_THEME.heroButtonLink);
      setHeroButtonScale(themeData.heroButtonScale?.toString() || DEFAULT_THEME.heroButtonScale);
      setHeroButtonRadius(themeData.heroButtonRadius?.toString() || DEFAULT_THEME.heroButtonRadius);
      setHeroAspectRatioDesktop(themeData.heroAspectRatioDesktop?.toString() || DEFAULT_THEME.heroAspectRatioDesktop);

      // Admin Sync
      setAdminPrimaryColor(themeData.adminPrimaryColor || DEFAULT_THEME.adminPrimaryColor);
      setAdminAccentColor(themeData.adminAccentColor || DEFAULT_THEME.adminAccentColor);
      setAdminTextColor(themeData.adminTextColor || DEFAULT_THEME.adminTextColor);
      setAdminBaseFontSize(themeData.adminBaseFontSize?.toString() || DEFAULT_THEME.adminBaseFontSize);
      setAdminHeadlineFont(themeData.adminHeadlineFont || DEFAULT_THEME.adminHeadlineFont);
      setAdminBodyFont(themeData.adminBodyFont || DEFAULT_THEME.adminBodyFont);
      setAdminHeaderHeight(themeData.adminHeaderHeight?.toString() || DEFAULT_THEME.adminHeaderHeight);
      setAdminSidebarBg(themeData.adminSidebarBg || DEFAULT_THEME.adminSidebarBg);
      setAdminSidebarHeaderSize(themeData.adminSidebarHeaderSize?.toString() || DEFAULT_THEME.adminSidebarHeaderSize);
      setAdminSidebarHeaderColor(themeData.adminSidebarHeaderColor || DEFAULT_THEME.adminSidebarHeaderColor);
      setAdminSidebarItemSize(themeData.adminSidebarItemSize?.toString() || DEFAULT_THEME.adminSidebarItemSize);
      setAdminSidebarItemColor(themeData.adminSidebarItemColor || DEFAULT_THEME.adminSidebarItemColor);
      setAdminSidebarActiveBg(themeData.adminSidebarActiveBg || DEFAULT_THEME.adminSidebarActiveBg);
      setAdminSidebarActiveText(themeData.adminSidebarActiveText || DEFAULT_THEME.adminSidebarActiveText);
    }
  }, [themeData]);

  const handleSave = () => {
    if (!themeRef) return;
    setIsSaving(true);

    const payload = {
      primaryColor,
      accentColor,
      headlineFont,
      bodyFont,
      borderRadius: Number(borderRadius),
      bannerEnabled,
      bannerText,
      bannerBgColor,
      bannerFont,
      bannerFontSize: Number(bannerFontSize),
      homepageLayout,
      categoryTextAlign,
      categoryVerticalAlign,
      categoryTitleSize: Number(categoryTitleSize),
      categoryTitleColor,
      categoryCardTextAlign,
      categoryCardVerticalAlign,
      categoryCardTitleSize: Number(categoryCardTitleSize),
      categoryCardTitleColor,
      archiveTextAlign,
      archiveTitleSize: Number(archiveTitleSize),
      archiveTitleColor,
      featuredTextAlign,
      featuredTitleSize: Number(featuredTitleSize),
      featuredTitleColor,
      productTitleSize: Number(productTitleSize),
      productTitleColor,
      productPriceSize: Number(productPriceSize),
      productPriceColor,
      productTextAlign,
      stickyHeader,
      categorySectionTitle,
      categorySectionSubtitle,
      archiveSectionTitle,
      archiveSectionSubtitle,
      showBrand,
      maintenanceMode,
      maintenanceMessage,
      adminPrimaryColor,
      adminAccentColor,
      adminTextColor,
      adminBaseFontSize: Number(adminBaseFontSize),
      adminHeadlineFont,
      adminBodyFont,
      adminHeaderHeight: Number(adminHeaderHeight),
      adminSidebarBg,
      adminSidebarHeaderSize: Number(adminSidebarHeaderSize),
      adminSidebarHeaderColor,
      adminSidebarItemSize: Number(adminSidebarItemSize),
      adminSidebarItemColor,
      adminSidebarActiveBg,
      adminSidebarActiveText,
      reviewBadgeSize: Number(reviewBadgeSize),
      reviewBadgeColor,
      reviewBadgeTopDesktop: Number(reviewBadgeTopDesktop),
      reviewBadgeTopMobile: Number(reviewBadgeTopMobile),
      reviewBadgeRight: Number(reviewBadgeRight),
      reviewBadgeVisibility,
      cardSkuSize: Number(cardSkuSize),
      cardSkuColor,
      cardReviewScale: Number(cardReviewScale),
      cardReviewColor,
      cardReviewPosition,
      detailTitleSize: Number(detailTitleSize),
      detailTitleColor,
      detailPriceSize: Number(detailPriceSize),
      detailPriceColor,
      detailSkuSize: Number(detailSkuSize),
      detailSkuColor,
      detailBrandSize: Number(detailBrandSize),
      detailBrandColor,
      detailReviewScale: Number(detailReviewScale),
      detailReviewColor,
      btnScale: Number(btnScale),
      btnRadius: Number(btnRadius),
      btnBgColor,
      btnHoverColor,
      btnFontWeight,
      btnTextTransform,
      btnBorderWidth: Number(btnBorderWidth),
      btnPaddingX: Number(btnPaddingX),
      btnPaddingY: Number(btnPaddingY),
      heroHeadlineSize: Number(heroHeadlineSize),
      heroSubheadlineSize: Number(heroSubheadlineSize),
      heroButtonText,
      heroButtonLink,
      heroButtonScale: Number(heroButtonScale),
      heroButtonRadius: Number(heroButtonRadius),
      heroAspectRatioDesktop: Number(heroAspectRatioDesktop),
      updatedAt: serverTimestamp()
    };

    setDoc(themeRef, payload, { merge: true })
      .then(() => {
        toast({ title: "Theme Updated", description: "Global styles have been synchronized with the archive." });
      })
      .catch((error) => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: themeRef.path,
          operation: 'write',
          requestResourceData: payload
        }));
      })
      .finally(() => setIsSaving(false));
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-[9999] bg-white flex items-center justify-center">
        <img src="/icon.png" alt="Loading" className="w-24 h-24 sm:w-32 sm:h-32 object-contain animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-8 min-h-screen pb-20 overflow-x-hidden">
      <style>{`
        #theme-preview-root {
          --preview-primary: ${primaryColor};
          --preview-accent: ${accentColor};
          --preview-radius: ${borderRadius}px;
          --preview-headline: "${headlineFont}", serif;
          --preview-body: "${bodyFont}", sans-serif;
          --preview-banner-font: "${bannerFont}", sans-serif;
          --preview-banner-font-size: ${bannerFontSize}px;
          --preview-cat-align: ${categoryTextAlign};
          --preview-cat-vertical: ${categoryVerticalAlign === 'bottom' ? 'flex-end' : categoryVerticalAlign === 'top' ? 'flex-start' : 'center'};
          --preview-cat-size: ${categoryTitleSize}px;
          --preview-cat-color: ${categoryTitleColor};
          --preview-cat-card-align: ${categoryCardTextAlign};
          --preview-cat-card-vertical: ${categoryCardVerticalAlign === 'bottom' ? 'flex-end' : categoryCardVerticalAlign === 'top' ? 'flex-start' : 'center'};
          --preview-cat-card-size: ${categoryCardTitleSize}px;
          --preview-cat-card-color: ${categoryCardTitleColor};
          --preview-archive-align: ${archiveTextAlign};
          --preview-archive-size: ${archiveTitleSize}px;
          --preview-archive-color: ${archiveTitleColor};
          --preview-feat-align: ${featuredTextAlign};
          --preview-feat-size: ${featuredTitleSize}px;
          --preview-feat-color: ${featuredTitleColor};
          --preview-prod-align: ${productTextAlign};
          --preview-prod-size: ${productTitleSize}px;
          --preview-prod-color: ${productTitleColor};
          --preview-price-size: ${productPriceSize}px;
          --preview-price-color: ${productPriceColor};
          --preview-card-sku-size: ${cardSkuSize}px;
          --preview-card-sku-color: ${cardSkuColor};
          --preview-card-review-scale: ${cardReviewScale};
          --preview-card-review-color: ${cardReviewColor};
          --preview-detail-title-size: ${detailTitleSize}px;
          --preview-detail-title-color: ${detailTitleColor};
          --preview-detail-price-size: ${detailPriceSize}px;
          --preview-detail-price-color: ${detailPriceColor};
          --preview-detail-sku-size: ${detailSkuSize}px;
          --preview-detail-sku-color: ${detailSkuColor};
          --preview-detail-brand-size: ${detailBrandSize}px;
          --preview-detail-brand-color: ${detailBrandColor};
          --preview-detail-review-scale: ${detailReviewScale};
          --preview-detail-review-color: ${detailReviewColor};
          --preview-btn-scale: ${btnScale};
          --preview-btn-radius: ${btnRadius}px;
          --preview-btn-bg: ${btnBgColor};
          --preview-btn-hover: ${btnHoverColor};
          --preview-btn-weight: ${btnFontWeight};
          --preview-btn-transform: ${btnTextTransform};
          --preview-btn-border: ${btnBorderWidth}px;
          --preview-btn-px: ${btnPaddingX}px;
          --preview-btn-py: ${btnPaddingY}px;
        }
        #theme-preview-root .font-headline { font-family: var(--preview-headline) !important; }
        #theme-preview-root .font-body { font-family: var(--preview-body) !important; }
        #theme-preview-root .preview-banner { font-family: var(--preview-banner-font) !important; font-size: var(--preview-banner-font-size) !important; }
        #theme-preview-root .preview-cat-title { text-align: var(--preview-cat-align) !important; font-size: var(--preview-cat-size) !important; color: var(--preview-cat-color) !important; }
        #theme-preview-root .preview-cat-card-title { text-align: var(--preview-cat-card-align) !important; font-size: var(--preview-cat-card-size) !important; color: var(--preview-cat-card-color) !important; }
        #theme-preview-root .preview-archive-title { text-align: var(--preview-archive-align) !important; font-size: var(--preview-archive-size) !important; color: var(--preview-archive-color) !important; }
        #theme-preview-root .preview-feat-title { text-align: var(--preview-feat-align) !important; font-size: var(--preview-feat-size) !important; color: var(--preview-feat-color) !important; }
        #theme-preview-root .preview-prod-card { text-align: var(--preview-prod-align) !important; }
        #theme-preview-root .preview-prod-title { font-size: var(--preview-prod-size) !important; color: var(--preview-prod-color) !important; }
        #theme-preview-root .preview-price { font-size: var(--preview-price-size) !important; color: var(--preview-price-color) !important; }
        #theme-preview-root .preview-card-sku { font-size: var(--preview-card-sku-size) !important; color: var(--preview-card-sku-color) !important; }
        #theme-preview-root .preview-card-review { transform: scale(var(--preview-card-review-scale)) !important; color: var(--preview-card-review-color) !important; }
        #theme-preview-root .preview-detail-title { font-size: var(--preview-detail-title-size) !important; color: var(--preview-detail-title-color) !important; }
        #theme-preview-root .preview-detail-price { font-size: var(--preview-detail-price-size) !important; color: var(--preview-detail-price-color) !important; }
        #theme-preview-root .preview-detail-sku { font-size: var(--preview-detail-sku-size) !important; color: var(--preview-detail-sku-color) !important; }
        #theme-preview-root .preview-detail-brand { font-size: var(--preview-detail-brand-size) !important; color: var(--preview-detail-brand-color) !important; }
        #theme-preview-root .preview-detail-review { transform: scale(var(--preview-detail-review-scale)) !important; color: var(--preview-detail-review-color) !important; }
        #theme-preview-root .preview-btn {
          transform: scale(var(--preview-btn-scale)) !important;
          border-radius: var(--preview-btn-radius) !important;
        }
        .hero-button {
          background-color: var(--hero-button-bg) !important;
          color: var(--hero-button-text) !important;
          border-radius: var(--hero-btn-radius) !important;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
        }
        
        .hero-button:hover {
          opacity: 0.95;
        }
      `}</style>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#1a1c1e]">Theme Engine</h1>
          <p className="text-[#5c5f62] mt-1 text-[10px] sm:text-sm uppercase font-medium tracking-tight">Live-edit your storefront's global identity.</p>
        </div>
        <Button className="w-full sm:w-auto h-10 gap-2 bg-black text-white font-bold uppercase tracking-widest text-[10px] px-8 hover:bg-[#D3D3D3] transition-all shadow-lg" onClick={handleSave} disabled={isSaving}>
          {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save Styles
        </Button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 xl:h-[calc(100vh-250px)] h-auto">
        <div className="xl:col-span-5 xl:overflow-y-auto pr-0 xl:pr-4 space-y-6 scrollbar-hide h-full">
          <Tabs defaultValue="styles" className="w-full">
            {/* LAYER 01: PRIMARY SECTIONS */}
            <TabsList className="w-full bg-white border h-auto xl:h-14 p-1 grid grid-cols-3 sm:flex sm:flex-nowrap rounded-none mb-8 overflow-visible">
              {[
                { id: 'styles', label: 'Styles', icon: Palette },
                { id: 'buttons', label: 'Buttons', icon: MousePointer2 },
                { id: 'catalog', label: 'Nav', icon: Layers },
                { id: 'layout', label: 'Layout', icon: Layout },
                { id: 'admin', label: 'Admin', icon: Settings2 },
              ].map((tab) => (
                <TabsTrigger 
                  key={tab.id} 
                  value={tab.id} 
                  className="flex-1 min-w-0 gap-1 sm:gap-2 font-bold uppercase tracking-[0.1em] sm:tracking-widest text-[7px] sm:text-[9px] h-12 rounded-none transition-all data-[state=active]:bg-black data-[state=active]:text-white hover:bg-gray-100 data-[state=active]:hover:bg-black px-0.5 sm:px-4"
                >
                  <tab.icon className="h-3 w-3 sm:h-3.5 sm:w-3.5 shrink-0" />
                  <span className="truncate">{tab.label}</span>
                </TabsTrigger>
              ))}
            </TabsList>

            {/* LAYER 02: STYLES SUB-TABS */}
            <TabsContent value="styles" className="m-0 space-y-6 animate-in fade-in duration-300">
              <Tabs defaultValue="identity" className="w-full">
                <TabsList className="w-full bg-gray-100/50 border border-dashed h-auto p-1 flex flex-nowrap rounded-none mb-6 overflow-hidden">
                  <TabsTrigger value="identity" className="flex-1 min-w-0 text-[7px] sm:text-[8px] font-bold uppercase tracking-tight sm:tracking-widest h-10 px-0.5 data-[state=active]:bg-white data-[state=active]:text-black rounded-none">Identity</TabsTrigger>
                  <TabsTrigger value="categories" className="flex-1 min-w-0 text-[7px] sm:text-[8px] font-bold uppercase tracking-tight sm:tracking-widest h-10 px-0.5 data-[state=active]:bg-white data-[state=active]:text-black rounded-none">Category</TabsTrigger>
                  <TabsTrigger value="products" className="flex-1 min-w-0 text-[7px] sm:text-[8px] font-bold uppercase tracking-tight sm:tracking-widest h-10 px-0.5 data-[state=active]:bg-white data-[state=active]:text-black rounded-none">Product</TabsTrigger>
                  <TabsTrigger value="reviews" className="flex-1 min-w-0 text-[7px] sm:text-[8px] font-bold uppercase tracking-tight sm:tracking-widest h-10 px-0.5 data-[state=active]:bg-white data-[state=active]:text-black rounded-none">Reviews</TabsTrigger>
                  <TabsTrigger value="archive" className="flex-1 min-w-0 text-[7px] sm:text-[8px] font-bold uppercase tracking-tight sm:tracking-widest h-10 px-0.5 data-[state=active]:bg-white data-[state=active]:text-black rounded-none">Archive</TabsTrigger>
                </TabsList>

                <TabsContent value="identity" className="space-y-6">
                  <Card className="border-[#e1e3e5] shadow-none rounded-none">
                    <CardHeader className="pb-4"><CardTitle className="text-[10px] uppercase tracking-widest font-bold text-gray-500 flex items-center gap-2"><Palette className="h-3.5 w-3.5" /> Brand Palette</CardTitle></CardHeader>
                    <CardContent className="space-y-6">
                      <div className="grid gap-2"><Label className="text-[9px] uppercase tracking-widest font-bold text-gray-400">Primary Color</Label><div className="flex gap-2"><div className="w-12 h-12 rounded border p-1 bg-white shadow-sm overflow-hidden"><Input type="color" className="w-[150%] h-[150%] border-none p-0 cursor-pointer -translate-x-1/4 -translate-y-1/4" value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} /></div><Input value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} className="h-12 font-mono text-xs uppercase" /></div></div>
                      <div className="grid gap-2"><Label className="text-[9px] uppercase tracking-widest font-bold text-gray-400">Accent Color</Label><div className="flex gap-2"><div className="w-12 h-12 rounded border p-1 bg-white shadow-sm overflow-hidden"><Input type="color" className="w-[150%] h-[150%] border-none p-0 cursor-pointer -translate-x-1/4 -translate-y-1/4" value={accentColor} onChange={(e) => setAccentColor(e.target.value)} /></div><Input value={accentColor} onChange={(e) => setAccentColor(e.target.value)} className="h-12 font-mono text-xs uppercase" /></div></div>
                    </CardContent>
                  </Card>
                   <Card className="border-[#e1e3e5] shadow-none rounded-none">
                    <CardHeader className="pb-4"><CardTitle className="text-[10px] uppercase tracking-widest font-bold text-gray-500 flex items-center gap-2"><Type className="h-3.5 w-3.5" /> Typography Design</CardTitle></CardHeader>
                    <CardContent className="space-y-8">
                      <div className="space-y-4"><Label className="text-[10px] uppercase tracking-[0.2em] font-bold text-primary">Main Font</Label><Select value={headlineFont} onValueChange={setHeadlineFont}><SelectTrigger className="h-14 bg-white border-2 border-primary/10 rounded-none"><SelectValue /></SelectTrigger><SelectContent className="max-h-[300px]">{sportsFonts.map(font => (<SelectItem key={font} value={font} className="text-sm font-bold uppercase py-3 cursor-pointer hover:bg-neutral-100 transition-colors duration-75"><span style={{ fontFamily: font }}>{font}</span></SelectItem>))}</SelectContent></Select></div>
                      <div className="space-y-4"><Label className="text-[10px] uppercase tracking-[0.2em] font-bold text-primary">Text Font</Label><Select value={bodyFont} onValueChange={setBodyFont}><SelectTrigger className="h-14 bg-white border-2 border-primary/10 rounded-none"><SelectValue /></SelectTrigger><SelectContent className="max-h-[300px]">{sportsFonts.map(font => (<SelectItem key={font} value={font} className="text-sm font-medium py-3 cursor-pointer hover:bg-neutral-100 transition-colors duration-75"><span style={{ fontFamily: font }}>{font}</span></SelectItem>))}</SelectContent></Select></div>
                      <div className="pt-4 border-t space-y-4"><div className="flex items-center justify-between"><Label className="text-[10px] uppercase tracking-widest font-bold text-gray-400">Border Sharpness</Label><span className="text-[10px] font-mono font-bold">{borderRadius}PX</span></div><input type="range" min="0" max="40" value={borderRadius} onChange={(e) => setBorderRadius(e.target.value)} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-black" /></div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="categories" className="space-y-6">
                  <Card className="border-[#e1e3e5] shadow-none rounded-none">
                    <CardHeader className="pb-4 border-b bg-gray-50/30"><CardTitle className="text-[10px] uppercase tracking-widest font-bold text-gray-500 flex items-center gap-2"><Layers className="h-3.5 w-3.5" /> Category Orchestration</CardTitle></CardHeader>
                    <CardContent className="pt-6 space-y-8">
                      <div className="space-y-6">
                        <div className="flex items-center gap-2"><div className="w-1 h-4 bg-primary" /><h3 className="text-[10px] uppercase tracking-widest font-bold text-primary">Main Title Styles</h3></div>
                        <div className="space-y-4"><div className="flex justify-between items-center"><Label className="text-[9px] uppercase font-bold text-gray-400">Title Scale</Label><Badge variant="outline" className="text-[10px] font-mono font-bold">{categoryTitleSize}PX</Badge></div><input type="range" min="16" max="120" value={categoryTitleSize} onChange={(e) => setCategoryTitleSize(e.target.value)} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-black" /></div>
                        <div className="grid gap-2"><Label className="text-[9px] uppercase font-bold text-gray-400">Title Color</Label><div className="flex gap-2"><Input type="color" value={categoryTitleColor} onChange={(e) => setCategoryTitleColor(e.target.value)} className="w-12 h-10 p-1" /><Input value={categoryTitleColor} onChange={(e) => setCategoryTitleColor(e.target.value)} className="h-10 font-mono text-[10px] uppercase" /></div></div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2"><Label className="text-[9px] uppercase font-bold text-gray-400">Horizontal</Label><div className="flex border p-1 rounded-none bg-gray-50"><Button variant={categoryTextAlign === 'left' ? 'default' : 'ghost'} size="icon" className="flex-1 h-8 rounded-none" onClick={() => setCategoryTextAlign('left')}><AlignLeft className="h-3.5 w-3.5" /></Button><Button variant={categoryTextAlign === 'center' ? 'default' : 'ghost'} size="icon" className="flex-1 h-8 rounded-none" onClick={() => setCategoryTextAlign('center')}><AlignCenter className="h-3.5 w-3.5" /></Button><Button variant={categoryTextAlign === 'right' ? 'default' : 'ghost'} size="icon" className="flex-1 h-8 rounded-none" onClick={() => setCategoryTextAlign('right')}><AlignRight className="h-3.5 w-3.5" /></Button></div></div>
                          <div className="space-y-2"><Label className="text-[9px] uppercase font-bold text-gray-400">Vertical</Label><div className="flex border p-1 rounded-none bg-gray-50"><Button variant={categoryVerticalAlign === 'top' ? 'default' : 'ghost'} size="icon" className="flex-1 h-8 rounded-none" onClick={() => setCategoryVerticalAlign('top')}><AlignLeft className="h-3.5 w-3.5 rotate-90" /></Button><Button variant={categoryVerticalAlign === 'center' ? 'default' : 'ghost'} size="icon" className="flex-1 h-8 rounded-none" onClick={() => setCategoryVerticalAlign('center')}><AlignCenter className="h-3.5 w-3.5 rotate-90" /></Button><Button variant={categoryVerticalAlign === 'bottom' ? 'default' : 'ghost'} size="icon" className="flex-1 h-8 rounded-none" onClick={() => setCategoryVerticalAlign('bottom')}><AlignRight className="h-3.5 w-3.5 rotate-90" /></Button></div></div>
                        </div>
                      </div>
                      <Separator />
                      <div className="space-y-6">
                        <div className="flex items-center gap-2"><div className="w-1 h-4 bg-primary" /><h3 className="text-[10px] uppercase tracking-widest font-bold text-primary">Card Geometry (Internal)</h3></div>
                        <div className="space-y-4"><div className="flex justify-between items-center"><Label className="text-[9px] uppercase font-bold text-gray-400">Card Title Scale</Label><Badge variant="outline" className="text-[10px] font-mono font-bold">{categoryCardTitleSize}PX</Badge></div><input type="range" min="12" max="64" value={categoryCardTitleSize} onChange={(e) => setCategoryCardTitleSize(e.target.value)} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-black" /></div>
                        <div className="grid gap-2"><Label className="text-[9px] uppercase font-bold text-gray-400">Card Title Color</Label><div className="flex gap-2"><Input type="color" value={categoryCardTitleColor} onChange={(e) => setCategoryCardTitleColor(e.target.value)} className="w-12 h-10 p-1" /><Input value={categoryCardTitleColor} onChange={(e) => setCategoryCardTitleColor(e.target.value)} className="h-10 font-mono text-[10px] uppercase" /></div></div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="products" className="space-y-6">
                  <Card className="border-[#e1e3e5] shadow-none rounded-none">
                    <CardHeader className="pb-4 border-b bg-gray-50/30">
                      <CardTitle className="text-[10px] uppercase tracking-widest font-bold text-gray-500 flex items-center gap-2">
                        <ShoppingBag className="h-3.5 w-3.5" /> Product UI Orchestration
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6 space-y-8">
                      {/* Product Card Section */}
                      <div className="space-y-6">
                        <div className="flex items-center gap-2">
                          <div className="w-1 h-4 bg-black" />
                          <h3 className="text-[10px] uppercase tracking-widest font-bold text-primary">Grid Display (Cards)</h3>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-4">
                            <div className="flex justify-between items-center">
                              <Label className="text-[9px] uppercase font-bold text-gray-400">Title Scale</Label>
                              <Badge variant="outline" className="text-[10px] font-mono font-bold">{productTitleSize}PX</Badge>
                            </div>
                            <input type="range" min="10" max="24" value={productTitleSize} onChange={(e) => setProductTitleSize(e.target.value)} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-black" />
                          </div>
                          <div className="grid gap-2">
                            <Label className="text-[9px] uppercase font-bold text-gray-400">Title Color</Label>
                            <div className="flex gap-2">
                              <Input type="color" value={productTitleColor} onChange={(e) => setProductTitleColor(e.target.value)} className="w-12 h-10 p-1" />
                              <Input value={productTitleColor} onChange={(e) => setProductTitleColor(e.target.value)} className="h-10 font-mono text-[10px] uppercase" />
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-4">
                            <div className="flex justify-between items-center">
                              <Label className="text-[9px] uppercase font-bold text-gray-400">Price Scale</Label>
                              <Badge variant="outline" className="text-[10px] font-mono font-bold">{productPriceSize}PX</Badge>
                            </div>
                            <input type="range" min="10" max="24" value={productPriceSize} onChange={(e) => setProductPriceSize(e.target.value)} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-black" />
                          </div>
                          <div className="grid gap-2">
                            <Label className="text-[9px] uppercase font-bold text-gray-400">Price Color</Label>
                            <div className="flex gap-2">
                              <Input type="color" value={productPriceColor} onChange={(e) => setProductPriceColor(e.target.value)} className="w-12 h-10 p-1" />
                              <Input value={productPriceColor} onChange={(e) => setProductPriceColor(e.target.value)} className="h-10 font-mono text-[10px] uppercase" />
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-4">
                            <div className="flex justify-between items-center">
                              <Label className="text-[9px] uppercase font-bold text-gray-400">SKU Scale</Label>
                              <Badge variant="outline" className="text-[10px] font-mono font-bold">{cardSkuSize}PX</Badge>
                            </div>
                            <input type="range" min="8" max="16" value={cardSkuSize} onChange={(e) => setCardSkuSize(e.target.value)} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-black" />
                          </div>
                          <div className="grid gap-2">
                            <Label className="text-[9px] uppercase font-bold text-gray-400">SKU Color</Label>
                            <div className="flex gap-2">
                              <Input type="color" value={cardSkuColor} onChange={(e) => setCardSkuColor(e.target.value)} className="w-12 h-10 p-1" />
                              <Input value={cardSkuColor} onChange={(e) => setCardSkuColor(e.target.value)} className="h-10 font-mono text-[10px] uppercase" />
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-4">
                            <div className="flex justify-between items-center">
                              <Label className="text-[9px] uppercase font-bold text-gray-400">Review Scale</Label>
                              <Badge variant="outline" className="text-[10px] font-mono font-bold">{cardReviewScale}X</Badge>
                            </div>
                            <input type="range" min="0.5" max="2.0" step="0.1" value={cardReviewScale} onChange={(e) => setCardReviewScale(e.target.value)} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-black" />
                          </div>
                          <div className="grid gap-2">
                            <Label className="text-[9px] uppercase font-bold text-gray-400">Review Color</Label>
                            <div className="flex gap-2">
                              <Input type="color" value={cardReviewColor} onChange={(e) => setCardReviewColor(e.target.value)} className="w-12 h-10 p-1" />
                              <Input value={cardReviewColor} onChange={(e) => setCardReviewColor(e.target.value)} className="h-10 font-mono text-[10px] uppercase" />
                            </div>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label className="text-[9px] uppercase font-bold text-gray-400">Review Position (Card)</Label>
                          <Select value={cardReviewPosition} onValueChange={setCardReviewPosition}>
                            <SelectTrigger className="h-10 rounded-none bg-gray-50 border-none text-[10px] font-bold uppercase">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="above_sku" className="text-[10px] font-bold uppercase">Above SKU</SelectItem>
                              <SelectItem value="below_sku" className="text-[10px] font-bold uppercase">Below SKU</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label className="text-[9px] uppercase font-bold text-gray-400">Text Align</Label>
                            <div className="flex border p-1 rounded-none bg-gray-50">
                              <Button variant={productTextAlign === 'left' ? 'default' : 'ghost'} size="icon" className="flex-1 h-8 rounded-none" onClick={() => setProductTextAlign('left')}><AlignLeft className="h-3.5 w-3.5" /></Button>
                              <Button variant={productTextAlign === 'center' ? 'default' : 'ghost'} size="icon" className="flex-1 h-8 rounded-none" onClick={() => setProductTextAlign('center')}><AlignCenter className="h-3.5 w-3.5" /></Button>
                              <Button variant={productTextAlign === 'right' ? 'default' : 'ghost'} size="icon" className="flex-1 h-8 rounded-none" onClick={() => setProductTextAlign('right')}><AlignRight className="h-3.5 w-3.5" /></Button>
                            </div>
                          </div>
                          <div className="flex items-center justify-between p-2 bg-gray-50 border rounded-none">
                            <div className="space-y-0.5">
                              <Label className="text-[9px] uppercase font-bold text-gray-500">Show Brand</Label>
                            </div>
                            <Switch checked={showBrand} onCheckedChange={setShowBrand} className="scale-75" />
                          </div>
                        </div>
                      </div>

                      <Separator />

                      {/* Product Detail Section */}
                      <div className="space-y-6">
                        <div className="flex items-center gap-2">
                          <div className="w-1 h-4 bg-black" />
                          <h3 className="text-[10px] uppercase tracking-widest font-bold text-primary">Detail View (Page)</h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-4">
                            <div className="flex justify-between items-center">
                              <Label className="text-[9px] uppercase font-bold text-gray-400">Title Scale</Label>
                              <Badge variant="outline" className="text-[10px] font-mono font-bold">{detailTitleSize}PX</Badge>
                            </div>
                            <input type="range" min="20" max="80" value={detailTitleSize} onChange={(e) => setDetailTitleSize(e.target.value)} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-black" />
                          </div>
                          <div className="grid gap-2">
                            <Label className="text-[9px] uppercase font-bold text-gray-400">Title Color</Label>
                            <div className="flex gap-2">
                              <Input type="color" value={detailTitleColor} onChange={(e) => setDetailTitleColor(e.target.value)} className="w-12 h-10 p-1" />
                              <Input value={detailTitleColor} onChange={(e) => setDetailTitleColor(e.target.value)} className="h-10 font-mono text-[10px] uppercase" />
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-4">
                            <div className="flex justify-between items-center">
                              <Label className="text-[9px] uppercase font-bold text-gray-400">Price Scale</Label>
                              <Badge variant="outline" className="text-[10px] font-mono font-bold">{detailPriceSize}PX</Badge>
                            </div>
                            <input type="range" min="16" max="64" value={detailPriceSize} onChange={(e) => setDetailPriceSize(e.target.value)} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-black" />
                          </div>
                          <div className="grid gap-2">
                            <Label className="text-[9px] uppercase font-bold text-gray-400">Price Color</Label>
                            <div className="flex gap-2">
                              <Input type="color" value={detailPriceColor} onChange={(e) => setDetailPriceColor(e.target.value)} className="w-12 h-10 p-1" />
                              <Input value={detailPriceColor} onChange={(e) => setDetailPriceColor(e.target.value)} className="h-10 font-mono text-[10px] uppercase" />
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-4">
                            <div className="flex justify-between items-center">
                              <Label className="text-[9px] uppercase font-bold text-gray-400">SKU Scale</Label>
                              <Badge variant="outline" className="text-[10px] font-mono font-bold">{detailSkuSize}PX</Badge>
                            </div>
                            <input type="range" min="8" max="20" value={detailSkuSize} onChange={(e) => setDetailSkuSize(e.target.value)} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-black" />
                          </div>
                          <div className="grid gap-2">
                            <Label className="text-[9px] uppercase font-bold text-gray-400">SKU Color</Label>
                            <div className="flex gap-2">
                              <Input type="color" value={detailSkuColor} onChange={(e) => setDetailSkuColor(e.target.value)} className="w-12 h-10 p-1" />
                              <Input value={detailSkuColor} onChange={(e) => setDetailSkuColor(e.target.value)} className="h-10 font-mono text-[10px] uppercase" />
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-4">
                            <div className="flex justify-between items-center">
                              <Label className="text-[9px] uppercase font-bold text-gray-400">Brand Scale</Label>
                              <Badge variant="outline" className="text-[10px] font-mono font-bold">{detailBrandSize}PX</Badge>
                            </div>
                            <input type="range" min="8" max="20" value={detailBrandSize} onChange={(e) => setDetailBrandSize(e.target.value)} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-black" />
                          </div>
                          <div className="grid gap-2">
                            <Label className="text-[9px] uppercase font-bold text-gray-400">Brand Color</Label>
                            <div className="flex gap-2">
                              <Input type="color" value={detailBrandColor} onChange={(e) => setDetailBrandColor(e.target.value)} className="w-12 h-10 p-1" />
                              <Input value={detailBrandColor} onChange={(e) => setDetailBrandColor(e.target.value)} className="h-10 font-mono text-[10px] uppercase" />
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-4">
                            <div className="flex justify-between items-center">
                              <Label className="text-[9px] uppercase font-bold text-gray-400">Review Scale</Label>
                              <Badge variant="outline" className="text-[10px] font-mono font-bold">{detailReviewScale}X</Badge>
                            </div>
                            <input type="range" min="0.5" max="2.0" step="0.1" value={detailReviewScale} onChange={(e) => setDetailReviewScale(e.target.value)} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-black" />
                          </div>
                          <div className="grid gap-2">
                            <Label className="text-[9px] uppercase font-bold text-gray-400">Review Color</Label>
                            <div className="flex gap-2">
                              <Input type="color" value={detailReviewColor} onChange={(e) => setDetailReviewColor(e.target.value)} className="w-12 h-10 p-1" />
                              <Input value={detailReviewColor} onChange={(e) => setDetailReviewColor(e.target.value)} className="h-10 font-mono text-[10px] uppercase" />
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
                <TabsContent value="reviews" className="space-y-6">
                  <Card className="border-[#e1e3e5] shadow-none rounded-none">
                    <CardHeader className="pb-4 border-b bg-gray-50/30">
                      <CardTitle className="text-[10px] uppercase tracking-widest font-bold text-gray-500 flex items-center gap-2">
                        <CircleDot className="h-3.5 w-3.5" /> Review Badge System
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6 space-y-8">
                      <div className="flex items-center justify-between p-4 bg-gray-50/50 border border-dashed rounded-none">
                        <div className="space-y-0.5">
                          <Label className="text-[10px] uppercase tracking-widest font-bold text-gray-500">Global Visibility</Label>
                          <p className="text-[8px] text-gray-400 font-medium uppercase tracking-tight">Show floating review badge on storefront.</p>
                        </div>
                        <Switch checked={reviewBadgeVisibility} onCheckedChange={setReviewBadgeVisibility} />
                      </div>
                      
                      <div className="space-y-6">
                        <div className="space-y-4">
                          <div className="flex justify-between items-center">
                            <Label className="text-[9px] uppercase font-bold text-gray-400">Scale Multiplier</Label>
                            <Badge variant="outline" className="text-[10px] font-mono font-bold">{reviewBadgeSize}X</Badge>
                          </div>
                          <input type="range" min="0.5" max="2.0" step="0.1" value={reviewBadgeSize} onChange={(e) => setReviewBadgeSize(e.target.value)} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-black" />
                        </div>
                        
                        <div className="grid gap-2">
                          <Label className="text-[9px] uppercase font-bold text-gray-400">Badge Color</Label>
                          <div className="flex gap-2">
                            <Input type="color" value={reviewBadgeColor} onChange={(e) => setReviewBadgeColor(e.target.value)} className="w-12 h-10 p-1" />
                            <Input value={reviewBadgeColor} onChange={(e) => setReviewBadgeColor(e.target.value)} className="h-10 font-mono text-[10px] uppercase" />
                          </div>
                        </div>

                        <Separator />

                        <div className="space-y-4">
                          <div className="flex justify-between items-center">
                            <Label className="text-[9px] uppercase font-bold text-gray-400">Top Offset (Desktop)</Label>
                            <Badge variant="outline" className="text-[10px] font-mono font-bold">{reviewBadgeTopDesktop}PX</Badge>
                          </div>
                          <input type="range" min="0" max="300" value={reviewBadgeTopDesktop} onChange={(e) => setReviewBadgeTopDesktop(e.target.value)} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-black" />
                        </div>

                        <div className="space-y-4">
                          <div className="flex justify-between items-center">
                            <Label className="text-[9px] uppercase font-bold text-gray-400">Top Offset (Mobile)</Label>
                            <Badge variant="outline" className="text-[10px] font-mono font-bold">{reviewBadgeTopMobile}PX</Badge>
                          </div>
                          <input type="range" min="0" max="300" value={reviewBadgeTopMobile} onChange={(e) => setReviewBadgeTopMobile(e.target.value)} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-black" />
                        </div>

                        <div className="space-y-4">
                          <div className="flex justify-between items-center">
                            <Label className="text-[9px] uppercase font-bold text-gray-400">Right Padding</Label>
                            <Badge variant="outline" className="text-[10px] font-mono font-bold">{reviewBadgeRight}PX</Badge>
                          </div>
                          <input type="range" min="0" max="100" value={reviewBadgeRight} onChange={(e) => setReviewBadgeRight(e.target.value)} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-black" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="archive" className="space-y-6">
                  <Card className="border-[#e1e3e5] shadow-none rounded-none">
                    <CardHeader className="pb-4 border-b bg-gray-50/30"><CardTitle className="text-[10px] uppercase tracking-widest font-bold text-gray-500 flex items-center gap-2"><Layers className="h-3.5 w-3.5" /> Archive Scaling</CardTitle></CardHeader>
                    <CardContent className="pt-6 space-y-8">
                      <div className="space-y-4"><div className="flex justify-between items-center"><Label className="text-[9px] uppercase font-bold text-gray-400">Archive Title Scale</Label><Badge variant="outline" className="text-[10px] font-mono font-bold">{archiveTitleSize}PX</Badge></div><input type="range" min="16" max="120" value={archiveTitleSize} onChange={(e) => setArchiveTitleSize(e.target.value)} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-black" /></div>
                      <div className="grid gap-2"><Label className="text-[9px] uppercase font-bold text-gray-400">Archive Title Color</Label><div className="flex gap-2"><Input type="color" value={archiveTitleColor} onChange={(e) => setArchiveTitleColor(e.target.value)} className="w-12 h-10 p-1" /><Input value={archiveTitleColor} onChange={(e) => setArchiveTitleColor(e.target.value)} className="h-10 font-mono text-[10px] uppercase" /></div></div>
                      <div className="space-y-2"><Label className="text-[9px] uppercase font-bold text-gray-400">Archive Alignment</Label><div className="flex border p-1 rounded-none bg-gray-50"><Button variant={archiveTextAlign === 'left' ? 'default' : 'ghost'} size="icon" className="flex-1 h-8 rounded-none" onClick={() => setArchiveTextAlign('left')}><AlignLeft className="h-3.5 w-3.5" /></Button><Button variant={archiveTextAlign === 'center' ? 'default' : 'ghost'} size="icon" className="flex-1 h-8 rounded-none" onClick={() => setArchiveTextAlign('center')}><AlignCenter className="h-3.5 w-3.5" /></Button><Button variant={archiveTextAlign === 'right' ? 'default' : 'ghost'} size="icon" className="flex-1 h-8 rounded-none" onClick={() => setArchiveTextAlign('right')}><AlignRight className="h-3.5 w-3.5" /></Button></div></div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </TabsContent>
            
            {/* LAYER 01: BUTTON THEME ENGINE */}
            <TabsContent value="buttons" className="mt-0 space-y-6 animate-in fade-in duration-500">
              <div className="flex flex-col gap-8">
                <Card className="border-[#e1e3e5] shadow-none rounded-none bg-white">
                  <CardHeader className="pb-4">
                    <div className="flex items-center gap-3 mb-1">
                      <MousePointer2 className="h-5 w-5 text-black" />
                      <CardTitle className="text-lg font-bold uppercase tracking-widest text-[#1a1c1e]">Button Theme Engine</CardTitle>
                    </div>
                    <CardDescription className="text-[10px] uppercase font-bold tracking-tight text-gray-400">Master the aesthetic delivery of storefront interactive elements.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-10 pt-4">
                    {/* Global Scale */}
                    <div className="space-y-6">
                      <div className="flex justify-between items-center">
                        <Label className="text-[10px] uppercase font-bold tracking-[0.2em] text-gray-400">Button Scale (Padding)</Label>
                        <span className="text-xs font-bold font-mono">{btnScale}X</span>
                      </div>
                      <input 
                        type="range" min="0.5" max="1.5" step="0.05" 
                        value={btnScale} 
                        onChange={(e) => setBtnScale(e.target.value)} 
                        className="w-full h-1.5 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-black" 
                      />
                    </div>

                    {/* Corner Radius */}
                    <div className="space-y-6">
                      <div className="flex justify-between items-center">
                        <Label className="text-[10px] uppercase font-bold tracking-[0.2em] text-gray-400">Corner Radius</Label>
                        <span className="text-xs font-bold font-mono">{btnRadius}PX</span>
                      </div>
                      <div className="grid grid-cols-5 gap-2">
                        {[
                          { label: 'NONE', value: '0' },
                          { label: '4PX', value: '4' },
                          { label: '8PX', value: '8' },
                          { label: '16PX', value: '16' },
                          { label: 'PILL', value: '99' }
                        ].map((choice) => (
                          <button
                            key={choice.value}
                            onClick={() => setBtnRadius(choice.value)}
                            className={cn(
                              "h-12 border text-[8px] font-bold tracking-widest transition-all",
                              btnRadius === choice.value 
                                ? "bg-black text-white border-black shadow-lg" 
                                : "bg-white text-gray-400 hover:border-black/20"
                            )}
                          >
                            {choice.label}
                          </button>
                        ))}
                      </div>
                      <input 
                        type="range" min="0" max="40" 
                        value={btnRadius} 
                        onChange={(e) => setBtnRadius(e.target.value)} 
                        className="w-full h-1.5 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-black" 
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                      {/* Primary background */}
                      <div className="space-y-4">
                        <Label className="text-[10px] uppercase font-bold tracking-[0.2em] text-gray-400 block">Brand Primary (Background)</Label>
                        <div className="flex items-center gap-3">
                          <div className="w-14 h-14 border p-1 bg-white shadow-sm overflow-hidden flex-shrink-0">
                            <input 
                              type="color" 
                              value={btnBgColor} 
                              onChange={(e) => setBtnBgColor(e.target.value)} 
                              className="w-[200%] h-[200%] border-none p-0 cursor-pointer -translate-x-1/4 -translate-y-1/4" 
                            />
                          </div>
                          <Input 
                            value={btnBgColor} 
                            onChange={(e) => setBtnBgColor(e.target.value)} 
                            className="h-14 font-mono text-xs uppercase bg-gray-50/50 border-none rounded-none tracking-widest" 
                          />
                        </div>
                      </div>

                      {/* Hover color */}
                      <div className="space-y-4">
                        <Label className="text-[10px] uppercase font-bold tracking-[0.2em] text-gray-400 block">Hover State Color</Label>
                        <div className="flex items-center gap-3">
                          <div className="w-14 h-14 border p-1 bg-white shadow-sm overflow-hidden flex-shrink-0">
                            <input 
                              type="color" 
                              value={btnHoverColor} 
                              onChange={(e) => setBtnHoverColor(e.target.value)} 
                              className="w-[200%] h-[200%] border-none p-0 cursor-pointer -translate-x-1/4 -translate-y-1/4" 
                            />
                          </div>
                          <Input 
                            value={btnHoverColor} 
                            onChange={(e) => setBtnHoverColor(e.target.value)} 
                            className="h-14 font-mono text-xs uppercase bg-gray-50/50 border-none rounded-none tracking-widest" 
                          />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                      <div className="space-y-4">
                        <Label className="text-[10px] uppercase font-bold tracking-[0.2em] text-gray-400 block">Font Weight</Label>
                        <Select value={btnFontWeight} onValueChange={setBtnFontWeight}>
                          <SelectTrigger className="h-14 font-bold bg-gray-50/50 border-none rounded-none">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="300" className="font-light">300 Light</SelectItem>
                            <SelectItem value="400" className="font-normal">400 Normal</SelectItem>
                            <SelectItem value="500" className="font-medium">500 Medium</SelectItem>
                            <SelectItem value="600" className="font-semibold">600 Semibold</SelectItem>
                            <SelectItem value="700" className="font-bold">700 Bold</SelectItem>
                            <SelectItem value="800" className="font-extrabold">800 Black</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-4">
                        <Label className="text-[10px] uppercase font-bold tracking-[0.2em] text-gray-400 block">Text Case</Label>
                        <Select value={btnTextTransform} onValueChange={setBtnTextTransform}>
                          <SelectTrigger className="h-14 font-bold uppercase text-[10px] bg-gray-50/50 border-none rounded-none">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">Normal Case</SelectItem>
                            <SelectItem value="uppercase">UPPERCASE</SelectItem>
                            <SelectItem value="lowercase">lowercase</SelectItem>
                            <SelectItem value="capitalize">Capitalize</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
                      <div className="space-y-4">
                        <Label className="text-[10px] uppercase font-bold tracking-[0.2em] text-gray-400 block">Border Width</Label>
                        <div className="flex items-center gap-2">
                          <input 
                            type="range" min="0" max="5" step="1" 
                            value={btnBorderWidth} 
                            onChange={(e) => setBtnBorderWidth(e.target.value)} 
                            className="flex-1 h-1.5 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-black" 
                          />
                          <span className="text-[10px] font-bold font-mono w-6">{btnBorderWidth}</span>
                        </div>
                      </div>
                      <div className="space-y-4">
                        <Label className="text-[10px] uppercase font-bold tracking-[0.2em] text-gray-400 block">Padding X</Label>
                        <Input type="number" value={btnPaddingX} onChange={(e) => setBtnPaddingX(e.target.value)} className="h-12 font-bold bg-gray-50/50 border-none rounded-none" />
                      </div>
                      <div className="space-y-4">
                        <Label className="text-[10px] uppercase font-bold tracking-[0.2em] text-gray-400 block">Padding Y</Label>
                        <Input type="number" value={btnPaddingY} onChange={(e) => setBtnPaddingY(e.target.value)} className="h-12 font-bold bg-gray-50/50 border-none rounded-none" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-[#e1e3e5] shadow-none rounded-none flex flex-col items-center justify-end pb-12 bg-gray-50/30 border-dashed relative min-h-[400px]">
                  <div className="absolute top-4 left-4 flex items-center gap-2 opacity-30">
                    <Smartphone className="h-4 w-4" />
                    <span className="text-[8px] font-bold uppercase tracking-widest">Engine Preview</span>
                  </div>
                  <div className="space-y-6 w-full max-w-[280px]">
                    <div className="space-y-2">
                       <p className="text-[7px] text-gray-400 font-bold uppercase tracking-widest text-center">Storefront Add-to-Cart Preview</p>
                        <button 
                          className="w-full font-bold shadow-xl transition-all duration-300"
                          style={{ 
                            backgroundColor: btnBgColor, 
                            borderRadius: `${btnRadius}px`,
                            transform: `scale(${btnScale})`,
                            fontWeight: btnFontWeight,
                            textTransform: btnTextTransform as any,
                            borderWidth: `${btnBorderWidth}px`,
                            borderColor: '#000000',
                            borderStyle: btnBorderWidth !== '0' ? 'solid' : 'none',
                            paddingLeft: `${btnPaddingX}px`,
                            paddingRight: `${btnPaddingX}px`,
                            paddingTop: `${btnPaddingY}px`,
                            paddingBottom: `${btnPaddingY}px`,
                            fontSize: '10px',
                            letterSpacing: '0.2em',
                            color: '#FFFFFF'
                          }}
                        >
                          ADD TO CART
                        </button>
                    </div>
                    
                    <div className="space-y-2">
                       <p className="text-[7px] text-gray-400 font-bold uppercase tracking-widest text-center">Active Hover Visual</p>
                       <button 
                          className="w-full font-bold shadow-xl transition-all duration-300"
                          style={{ 
                            backgroundColor: btnHoverColor, 
                            borderRadius: `${btnRadius}px`,
                            transform: `scale(${btnScale})`,
                            fontWeight: btnFontWeight,
                            textTransform: btnTextTransform as any,
                            borderWidth: `${btnBorderWidth}px`,
                            borderColor: '#000000',
                            borderStyle: btnBorderWidth !== '0' ? 'solid' : 'none',
                            paddingLeft: `${btnPaddingX}px`,
                            paddingRight: `${btnPaddingX}px`,
                            paddingTop: `${btnPaddingY}px`,
                            paddingBottom: `${btnPaddingY}px`,
                            fontSize: '10px',
                            letterSpacing: '0.2em',
                            color: '#FFFFFF'
                          }}
                        >
                          HOVER STATE
                        </button>
                    </div>
                  </div>
                  
                  <div className="mt-12 p-4 bg-white border border-dashed rounded-none w-full max-w-[320px]">
                    <div className="flex gap-4 items-center">
                      <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center shrink-0">
                         <MousePointer2 className="h-5 w-5 text-gray-300" />
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-[9px] font-bold uppercase tracking-widest">UX Integration</h4>
                        <p className="text-[8px] text-gray-400 uppercase leading-tight">Changes apply globally to primary action buttons including checkout, cart, and product forms.</p>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>
            </TabsContent>
            
            {/* LAYER 02: NAV SUB-TABS */}
            <TabsContent value="catalog" className="mt-6 space-y-6 animate-in fade-in duration-300">
              <Tabs defaultValue="header" className="w-full">
                <TabsList className="w-full bg-gray-100/50 border border-dashed h-auto p-1 flex flex-nowrap rounded-none mb-6 overflow-hidden">
                  <TabsTrigger value="header" className="flex-1 min-w-0 text-[8px] font-bold uppercase tracking-widest h-10 data-[state=active]:bg-white data-[state=active]:text-black rounded-none transition-all">Header</TabsTrigger>
                  <TabsTrigger value="banner" className="flex-1 min-w-0 text-[8px] font-bold uppercase tracking-widest h-10 data-[state=active]:bg-white data-[state=active]:text-black rounded-none transition-all">Banner</TabsTrigger>
                </TabsList>
                <TabsContent value="header" className="space-y-6">
                  <Card className="border-[#e1e3e5] shadow-none rounded-none"><CardHeader className="flex flex-row items-center justify-between pb-4"><div className="space-y-1"><CardTitle className="text-[10px] uppercase tracking-widest font-bold text-gray-500">Header Interaction</CardTitle><CardDescription className="text-[9px] uppercase font-bold tracking-tight">Lock navigation to viewport.</CardDescription></div><Switch checked={stickyHeader} onCheckedChange={setStickyHeader} /></CardHeader></Card>
                </TabsContent>
                <TabsContent value="banner" className="space-y-6">
                  <Card className="border-[#e1e3e5] shadow-none rounded-none"><CardHeader className="flex flex-row items-center justify-between border-b bg-gray-50/30"><div><CardTitle className="text-[10px] uppercase tracking-widest font-bold text-gray-500 flex items-center gap-2"><Megaphone className="h-3.5 w-3.5" /> Announcement Bar</CardTitle><CardDescription className="text-[9px] uppercase font-bold tracking-tight">Promotional banner at top.</CardDescription></div><Switch checked={bannerEnabled} onCheckedChange={setBannerEnabled} /></CardHeader><CardContent className="pt-6 space-y-6"><div className="space-y-2"><Label className="text-[9px] uppercase tracking-widest font-bold text-gray-400">Banner Text</Label><Input value={bannerText} onChange={(e) => setBannerText(e.target.value)} className="h-12 uppercase font-bold text-xs" /></div><div className="grid grid-cols-2 gap-6"><div className="space-y-2"><Label className="text-[9px] uppercase tracking-widest font-bold text-gray-400">Background</Label><Input type="color" value={bannerBgColor} onChange={(e) => setBannerBgColor(e.target.value)} className="h-10 p-1" /></div><div className="space-y-2"><Label className="text-[9px] uppercase tracking-widest font-bold text-gray-400">Font Size</Label><Input type="number" value={bannerFontSize} onChange={(e) => setBannerFontSize(e.target.value)} className="h-10" /></div></div></CardContent></Card>
                </TabsContent>
              </Tabs>
            </TabsContent>

            {/* LAYER 02: LAYOUT SUB-TABS */}
            <TabsContent value="layout" className="mt-6 space-y-6 animate-in fade-in duration-300">
              <Tabs defaultValue="structure" className="w-full">
                <TabsList className="w-full bg-gray-100/50 border border-dashed h-auto p-1 flex flex-nowrap rounded-none mb-6 overflow-hidden">
                  <TabsTrigger value="structure" className="flex-1 min-w-0 text-[8px] font-bold uppercase tracking-widest h-10 data-[state=active]:bg-white data-[state=active]:text-black rounded-none transition-all">Structure</TabsTrigger>
                  <TabsTrigger value="hero" className="flex-1 min-w-0 text-[8px] font-bold uppercase tracking-widest h-10 data-[state=active]:bg-white data-[state=active]:text-black rounded-none transition-all">Hero Banner</TabsTrigger>
                  <TabsTrigger value="copy" className="flex-1 min-w-0 text-[8px] font-bold uppercase tracking-widest h-10 data-[state=active]:bg-white data-[state=active]:text-black rounded-none transition-all">Copy Labels</TabsTrigger>
                </TabsList>
                <TabsContent value="structure" className="space-y-6">
                  <Card className="border-[#e1e3e5] shadow-none rounded-none"><CardHeader className="pb-4"><CardTitle className="text-[10px] uppercase tracking-widest font-bold text-gray-500">Architecture</CardTitle></CardHeader><CardContent className="space-y-4"><div className="grid grid-cols-2 gap-4"><button onClick={() => setHomepageLayout('bento')} className={cn("p-4 rounded-sm flex flex-col items-center gap-3 transition-all", homepageLayout === 'bento' ? "bg-black text-white shadow-xl" : "bg-gray-100/50 text-gray-400 hover:bg-gray-100")}><span className="text-[9px] font-bold uppercase tracking-widest">Bento Grid</span></button><button onClick={() => setHomepageLayout('classic')} className={cn("p-4 rounded-sm flex flex-col items-center gap-3 transition-all", homepageLayout === 'classic' ? "bg-black text-white shadow-xl" : "bg-gray-100/50 text-gray-400 hover:bg-gray-100")}><span className="text-[9px] font-bold uppercase tracking-widest">Classic Full</span></button></div></CardContent></Card>
                </TabsContent>
                <TabsContent value="hero" className="space-y-6">
                  <Card className="border-[#e1e3e5] shadow-none rounded-none">
                    <CardHeader className="pb-4 border-b bg-gray-50/30">
                      <CardTitle className="text-[10px] uppercase tracking-widest font-bold text-gray-500 flex items-center gap-2">
                        <Megaphone className="h-3.5 w-3.5" /> Hero Content & Geometry
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6 space-y-8">
                      {/* Headlines */}
                      <div className="space-y-6">
                        <div className="flex items-center gap-2">
                          <div className="w-1 h-4 bg-primary" />
                          <h3 className="text-[10px] uppercase tracking-widest font-bold text-primary">Headline Geometry</h3>
                        </div>
                        <div className="space-y-4">
                          <div className="flex justify-between items-center">
                            <Label className="text-[9px] uppercase font-bold text-gray-400">Headline Scale</Label>
                            <Badge variant="outline" className="text-[10px] font-mono font-bold">{heroHeadlineSize}PX</Badge>
                          </div>
                          <input type="range" min="24" max="140" value={heroHeadlineSize} onChange={(e) => setHeroHeadlineSize(e.target.value)} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-black" />
                        </div>
                        <div className="space-y-4">
                          <div className="flex justify-between items-center">
                            <Label className="text-[9px] uppercase font-bold text-gray-400">Subheadline Scale</Label>
                            <Badge variant="outline" className="text-[10px] font-mono font-bold">{heroSubheadlineSize}PX</Badge>
                          </div>
                          <input type="range" min="8" max="40" value={heroSubheadlineSize} onChange={(e) => setHeroSubheadlineSize(e.target.value)} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-black" />
                        </div>

                        <div className="space-y-4">
                          <div className="flex justify-between items-center">
                            <Label className="text-[9px] uppercase font-bold text-gray-400">Desktop Height (Ratio)</Label>
                            <Badge variant="outline" className="text-[10px] font-mono font-bold">{heroAspectRatioDesktop}</Badge>
                          </div>
                          <input type="range" min="1.0" max="8.0" step="0.01" value={heroAspectRatioDesktop} onChange={(e) => setHeroAspectRatioDesktop(e.target.value)} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-black" />
                          <p className="text-[8px] text-gray-400 font-medium uppercase tracking-tight">Lower value = Taller banner. (e.g., 2.54 for current height).</p>
                        </div>
                      </div>

                      <Separator />

                      {/* CTA Button */}
                      <div className="space-y-6">
                        <div className="flex items-center gap-2">
                          <div className="w-1 h-4 bg-primary" />
                          <h3 className="text-[10px] uppercase tracking-widest font-bold text-primary">Call-To-Action Button</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label className="text-[9px] uppercase font-bold text-gray-400">Button Text</Label>
                            <Input value={heroButtonText} onChange={(e) => setHeroButtonText(e.target.value)} className="h-11 font-bold uppercase text-[10px]" />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-[9px] uppercase font-bold text-gray-400">Target Link</Label>
                            <Input value={heroButtonLink} onChange={(e) => setHeroButtonLink(e.target.value)} className="h-11 text-[10px]" />
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-4">
                            <div className="flex justify-between items-center">
                              <Label className="text-[9px] uppercase font-bold text-gray-400">Button Scale (Padding)</Label>
                              <Badge variant="outline" className="text-[10px] font-mono font-bold">{heroButtonScale}X</Badge>
                            </div>
                            <input type="range" min="0.5" max="2.0" step="0.1" value={heroButtonScale} onChange={(e) => setHeroButtonScale(e.target.value)} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-black" />
                          </div>
                          <div className="space-y-4">
                            <div className="flex justify-between items-center">
                              <Label className="text-[9px] uppercase font-bold text-gray-400">Corner Radius</Label>
                              <Badge variant="outline" className="text-[10px] font-mono font-bold">{heroButtonRadius}PX</Badge>
                            </div>
                            <input type="range" min="0" max="100" step="1" value={heroButtonRadius} onChange={(e) => setHeroButtonRadius(e.target.value)} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-black" />
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
                <TabsContent value="copy" className="space-y-6">
                  <Card className="border-[#e1e3e5] shadow-none rounded-none"><CardHeader className="pb-4 border-b bg-gray-50/30"><CardTitle className="text-[10px] uppercase tracking-widest font-bold text-gray-500 flex items-center gap-2"><TypeIcon className="h-3.5 w-3.5" /> Content Labels</CardTitle></CardHeader><CardContent className="pt-6 space-y-8"><div className="space-y-6"><div className="flex items-center gap-2"><div className="w-1 h-4 bg-primary" /><h3 className="text-[10px] uppercase tracking-widest font-bold text-primary">Category Section</h3></div><div className="grid grid-cols-1 md:grid-cols-2 gap-4"><div className="space-y-2"><Label className="text-[9px] uppercase font-bold text-gray-400">Main Title</Label><Input value={categorySectionTitle} onChange={(e) => setCategorySectionTitle(e.target.value)} className="h-11 font-bold uppercase text-[10px]" /></div><div className="space-y-2"><Label className="text-[9px] uppercase font-bold text-gray-400">Subtitle</Label><Input value={categorySectionSubtitle} onChange={(e) => setCategorySectionSubtitle(e.target.value)} className="h-11 uppercase text-[10px] tracking-widest" /></div></div></div><Separator /><div className="space-y-6"><div className="flex items-center gap-2"><div className="w-1 h-4 bg-primary" /><h3 className="text-[10px] uppercase tracking-widest font-bold text-primary">Global Archive</h3></div><div className="grid grid-cols-1 md:grid-cols-2 gap-4"><div className="space-y-2"><Label className="text-[9px] uppercase font-bold text-gray-400">Main Title</Label><Input value={archiveSectionTitle} onChange={(e) => setArchiveSectionTitle(e.target.value)} className="h-11 font-bold uppercase text-[10px]" /></div><div className="space-y-2"><Label className="text-[9px] uppercase font-bold text-gray-400">Subtitle</Label><Input value={archiveSectionSubtitle} onChange={(e) => setArchiveSectionSubtitle(e.target.value)} className="h-11 uppercase text-[10px] tracking-widest" /></div></div></div></CardContent></Card>
                </TabsContent>
              </Tabs>
            </TabsContent>

            {/* LAYER 02: ADMIN SUB-TABS */}
            <TabsContent value="admin" className="mt-6 space-y-6 animate-in fade-in duration-300 pb-12">
              <Tabs defaultValue="system" className="w-full">
                <TabsList className="w-full bg-gray-100/50 border border-dashed h-auto p-1 flex flex-nowrap rounded-none mb-6 overflow-hidden">
                  <TabsTrigger value="system" className="flex-1 min-w-0 text-[8px] font-bold uppercase tracking-widest h-10 data-[state=active]:bg-white data-[state=active]:text-black rounded-none transition-all">System</TabsTrigger>
                  <TabsTrigger value="sidebar" className="flex-1 min-w-0 text-[8px] font-bold uppercase tracking-widest h-10 data-[state=active]:bg-white data-[state=active]:text-black rounded-none transition-all">Sidebar</TabsTrigger>
                </TabsList>
                <TabsContent value="system" className="space-y-6">
                  <Card className="border-blue-100 bg-blue-50/10 shadow-none rounded-none">
                    <CardHeader className="pb-4 border-b"><CardTitle className="text-[10px] uppercase tracking-widest font-bold text-blue-600 flex items-center gap-2"><Settings2 className="h-3.5 w-3.5" /> Backend Core Architecture</CardTitle></CardHeader>
                    <CardContent className="pt-6 space-y-8">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div className="space-y-2"><Label className="text-[10px] uppercase font-bold text-primary">Brand Color</Label><Input type="color" value={adminPrimaryColor} onChange={(e) => setAdminPrimaryColor(e.target.value)} className="h-10 p-1" /></div>
                        <div className="space-y-2"><Label className="text-[10px] uppercase font-bold text-primary">Text Color</Label><Input type="color" value={adminTextColor} onChange={(e) => setAdminTextColor(e.target.value)} className="h-10 p-1" /></div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div className="space-y-2"><Label className="text-[10px] uppercase font-bold text-primary">Accent Background</Label><Input type="color" value={adminAccentColor} onChange={(e) => setAdminAccentColor(e.target.value)} className="h-10 p-1" /></div>
                        <div className="space-y-2"><Label className="text-[10px] uppercase font-bold text-primary">Header Height</Label><Input type="number" value={adminHeaderHeight} onChange={(e) => setAdminHeaderHeight(e.target.value)} className="h-10" /></div>
                      </div>
                      <div className="space-y-4"><div className="flex justify-between items-center"><Label className="text-[10px] uppercase font-bold text-primary">Font Scale</Label><Badge variant="outline" className="text-[10px] font-mono font-bold">{adminBaseFontSize}PX</Badge></div><input type="range" min="10" max="24" value={adminBaseFontSize} onChange={(e) => setAdminBaseFontSize(e.target.value)} className="w-full h-2 bg-blue-100 rounded-lg appearance-none cursor-pointer accent-blue-600" /></div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div className="space-y-4"><Label className="text-[10px] uppercase font-bold text-primary">Headline Font</Label><Select value={adminHeadlineFont} onValueChange={setAdminHeadlineFont}><SelectTrigger className="h-14 bg-white border border-blue-100 rounded-none"><SelectValue /></SelectTrigger><SelectContent className="max-h-[300px]">{sportsFonts.map(font => (<SelectItem key={font} value={font} className="text-sm font-bold uppercase py-3 hover:bg-neutral-100 transition-colors duration-75"><span style={{ fontFamily: font }}>{font}</span></SelectItem>))}</SelectContent></Select></div>
                        <div className="space-y-4"><Label className="text-[10px] uppercase font-bold text-primary">Body Font</Label><Select value={adminBodyFont} onValueChange={setAdminBodyFont}><SelectTrigger className="h-14 bg-white border border-blue-100 rounded-none"><SelectValue /></SelectTrigger><SelectContent className="max-h-[300px]">{sportsFonts.map(font => (<SelectItem key={font} value={font} className="text-sm font-medium py-3 hover:bg-neutral-100 transition-colors duration-75"><span style={{ fontFamily: font }}>{font}</span></SelectItem>))}</SelectContent></Select></div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
                <TabsContent value="sidebar" className="space-y-6">
                  <Card className="border-[#e1e3e5] shadow-none rounded-none overflow-hidden">
                    <CardHeader className="bg-gray-50/50 border-b p-4 sm:p-6"><CardTitle className="text-[10px] uppercase tracking-widest font-bold text-gray-500 flex items-center gap-2"><Layout className="h-3.5 w-3.5" /> Sidebar Architecture</CardTitle></CardHeader>
                    <CardContent className="pt-6 space-y-8">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div className="space-y-2"><Label className="text-[9px] uppercase tracking-widest font-bold text-gray-400">Background Color</Label><Input type="color" value={adminSidebarBg} onChange={(e) => setAdminSidebarBg(e.target.value)} className="h-10 p-1" /></div>
                        <div className="space-y-2"><Label className="text-[9px] uppercase tracking-widest font-bold text-gray-400">Header Color</Label><Input type="color" value={adminSidebarHeaderColor} onChange={(e) => setAdminSidebarHeaderColor(e.target.value)} className="h-10 p-1" /></div>
                      </div>
                      <div className="space-y-4"><div className="flex justify-between items-center"><Label className="text-[10px] uppercase font-bold text-gray-500">Header Scale</Label><Badge variant="outline" className="text-[10px] font-mono font-bold">{adminSidebarHeaderSize}PX</Badge></div><input type="range" min="8" max="16" value={adminSidebarHeaderSize} onChange={(e) => setAdminSidebarHeaderSize(e.target.value)} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-black" /></div>
                      <Separator />
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div className="space-y-2"><Label className="text-[9px] uppercase tracking-widest font-bold text-gray-400">Item Text Color</Label><Input type="color" value={adminSidebarItemColor} onChange={(e) => setAdminSidebarItemColor(e.target.value)} className="h-10 p-1" /></div>
                        <div className="space-y-4"><div className="flex justify-between items-center"><Label className="text-[10px] uppercase font-bold text-gray-500">Item Scale</Label><Badge variant="outline" className="text-[10px] font-mono font-bold">{adminSidebarItemSize}PX</Badge></div><input type="range" min="10" max="20" value={adminSidebarItemSize} onChange={(e) => setAdminSidebarItemSize(e.target.value)} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-black" /></div>
                      </div>
                      <Separator />
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div className="space-y-2"><Label className="text-[9px] uppercase tracking-widest font-bold text-gray-400">Active Background</Label><Input type="color" value={adminSidebarActiveBg} onChange={(e) => setAdminSidebarActiveBg(e.target.value)} className="h-10 p-1" /></div>
                        <div className="space-y-2"><Label className="text-[9px] uppercase tracking-widest font-bold text-gray-400">Active Text Color</Label><Input type="color" value={adminSidebarActiveText} onChange={(e) => setAdminSidebarActiveText(e.target.value)} className="h-10 p-1" /></div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </TabsContent>
          </Tabs>
        </div>

        <div id="theme-preview-root" className="xl:col-span-7 bg-[#f6f6f7] rounded-none flex flex-col border border-[#e1e3e5] overflow-hidden xl:h-full h-[600px] min-w-0">
          <div className="h-14 bg-white border-b flex items-center justify-between px-4 sm:px-6 shrink-0">
            <div className="hidden sm:flex gap-1.5"><div className="w-3 h-3 rounded-full bg-red-100 border border-red-200"></div><div className="w-3 h-3 rounded-full bg-yellow-100 border border-yellow-200"></div><div className="w-3 h-3 rounded-full bg-green-100 border border-green-200"></div></div>
            <div className="flex gap-1 border bg-gray-50 p-1 rounded-sm"><button onClick={() => setDevice('desktop')} className={cn("p-2 rounded-sm transition-all", device === 'desktop' ? "bg-white shadow-sm text-black" : "text-[#8c9196]")}><Monitor className="h-4 w-4" /></button><button onClick={() => setDevice('mobile')} className={cn("p-2 rounded-sm transition-all", device === 'mobile' ? "bg-white shadow-sm text-black" : "text-[#8c9196]")}><Smartphone className="h-4 w-4" /></button></div>
            <div className="flex items-center gap-2 text-[9px] text-green-600 uppercase font-bold tracking-widest"><div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />Live Sync</div>
          </div>
          <div className="flex-1 overflow-y-auto p-4 sm:p-8 xl:p-12 flex justify-center bg-[radial-gradient(#e1e3e5_1px,transparent_1px)] [background-size:24px_24px]">
            <div className={cn("bg-white transition-all duration-500 shadow-2xl overflow-hidden relative flex flex-col border border-black/5", device === 'desktop' ? "w-full max-w-3xl aspect-[16/10]" : "w-[320px] h-[568px] sm:w-[375px] sm:h-[667px]")}>
              {bannerEnabled && (<div className="preview-banner h-8 flex items-center justify-center uppercase tracking-[0.3em] font-bold text-white shrink-0 px-4 text-center" style={{ backgroundColor: bannerBgColor }}>{bannerText}</div>)}
               <div className="h-16 bg-white border-b flex items-center justify-between px-6 sm:px-8 shrink-0"><span className="font-bold text-lg sm:text-xl tracking-tighter font-headline" style={{ color: primaryColor }}>Feiselino</span><div className="flex items-center gap-3"><Search className="h-4 w-4 text-gray-200" /><ShoppingBag className="h-4 w-4 text-gray-200" /><div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full border bg-gray-50 flex items-center justify-center"><MousePointer2 className="h-4 w-4 text-gray-200" /></div></div></div>
              <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-12 font-body">
                <div className="aspect-video bg-gray-50 flex flex-col p-6 sm:p-12 border shadow-sm relative overflow-hidden" style={{ borderRadius: `${borderRadius}px`, alignItems: 'center', textAlign: 'center' }}>
                  <div className="relative z-10 w-full">
                    <span 
                      className="uppercase tracking-[0.5em] font-bold text-gray-400 mb-2 sm:mb-4 block"
                      style={{ fontSize: `${Math.max(6, Number(heroSubheadlineSize) * 0.6)}px` }}
                    >
                      PREMIUM QUALITY
                    </span>
                    <h2 
                      className="font-bold uppercase tracking-tight leading-none font-headline"
                      style={{ fontSize: `${Math.max(16, Number(heroHeadlineSize) * 0.4)}px` }}
                    >
                      NEW ARRIVALS
                    </h2>
                    <div className="mt-6 sm:mt-8 flex justify-center">
                      <div 
                        className="bg-black text-white px-6 sm:px-8 h-10 sm:h-12 flex items-center justify-center font-bold uppercase tracking-[0.2em] text-[10px] shadow-lg"
                        style={{ 
                          transform: `scale(${heroButtonScale})`,
                          borderRadius: `${heroButtonRadius}px`,
                        }}
                      >
                        {heroButtonText}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="space-y-8">
                  <div className="space-y-1">
                    <p className="text-[8px] uppercase tracking-[0.2em] font-bold text-gray-400">{categorySectionSubtitle}</p>
                    <h3 className="preview-cat-title font-headline font-bold uppercase tracking-tight">{categorySectionTitle}</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-4 sm:gap-8">
                    {[1, 2].map(i => (
                      <div key={i} className="flex flex-col gap-3">
                        <div className="preview-prod-card relative group aspect-square bg-gray-100 border overflow-hidden" style={{ borderRadius: `${borderRadius}px` }}>
                          <div className="absolute inset-0 bg-black/5" />
                        </div>
                        <div className="preview-cat-card-content">
                          <p className="preview-cat-card-title font-headline font-bold uppercase tracking-tight leading-none">Drop {i}</p>
                          <p className="text-[7px] font-bold uppercase tracking-widest mt-1 opacity-40">View Drop</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

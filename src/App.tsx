/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Mic, ShieldCheck } from 'lucide-react';
import { 
  TabId, 
  SaleEntry, 
  BuyerCrateBalance, 
  ColdStorageItem, 
  DebtRecord, 
  TraderProfile, 
  CargoTradeListing,
  CrateGuaranteeRates,
  FishCrateMapping,
  LogisticsShipment
} from './types';
import { 
  loadSales, 
  saveSales, 
  loadCrates, 
  saveCrates, 
  loadColdStorage, 
  saveColdStorage, 
  loadDebts, 
  saveDebts,
  loadTraders,
  registerTraderIfNew,
  loadCargoListings,
  saveCargoListings,
  calculateMerchantTier,
  loadGuaranteeRates,
  saveGuaranteeRates,
  loadFishCrateMapping,
  saveFishCrateMapping,
  loadLogisticsShipments,
  saveLogisticsShipments
} from './utils/storage';
import { soundEffects } from './utils/audio';

import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { FastSalesView } from './components/FastSalesView';
import { CratesView } from './components/CratesView';
import { ColdStorageView } from './components/ColdStorageView';
import { DebtsView } from './components/DebtsView';
import { MarketView } from './components/MarketView';
import { ReportsView } from './components/ReportsView';
import { VoiceAssistantModal } from './components/VoiceAssistantModal';
import { CrateSettingsModal } from './components/CrateSettingsModal';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabId>('fast_entry');
  const [currentPort, setCurrentPort] = useState<string>('الدار البيضاء');
  const [sellerName] = useState<string>('المعلم بوشعيب الصويري (البائع)');
  const [trialDaysLeft] = useState<number>(28);

  // Persistent Domain States
  const [sales, setSales] = useState<SaleEntry[]>(() => loadSales());
  const [traders, setTraders] = useState<TraderProfile[]>(() => loadTraders());
  const [crates, setCrates] = useState<BuyerCrateBalance[]>(() => loadCrates());
  const [storageItems, setStorageItems] = useState<ColdStorageItem[]>(() => loadColdStorage());
  const [debts, setDebts] = useState<DebtRecord[]>(() => loadDebts());
  const [cargoListings, setCargoListings] = useState<CargoTradeListing[]>(() => loadCargoListings());
  const [shipments, setShipments] = useState<LogisticsShipment[]>(() => loadLogisticsShipments());
  const [guaranteeRates, setGuaranteeRates] = useState<CrateGuaranteeRates>(() => loadGuaranteeRates());
  const [fishCrateMapping, setFishCrateMapping] = useState<FishCrateMapping>(() => loadFishCrateMapping());

  // Modals state
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  // Cumulative Seller Volume across all recorded sales and logistics cargo shipments
  const totalSellerVolume = sales.reduce((acc, s) => acc + s.crateCount, 0) +
    shipments.reduce((acc, s) => acc + s.shippedCrates, 0);

  // DYNAMIC PLATFORM MONETIZATION TIERS:
  // - Small Merchant (<500 crates): 1.00 MAD / crate
  // - Medium Merchant (500 to 999 crates): 0.80 MAD / crate
  // - Large Merchant (1,000+ crates): 0.70 MAD / crate
  const merchantTier = calculateMerchantTier(totalSellerVolume);

  // Calculate daily crate volume for today
  const todayStr = new Date().toISOString().split('T')[0];
  const todaySales = sales.filter(s => s.date === todayStr);
  const todayShipments = shipments.filter(s => s.date === todayStr);
  const dailyCratesTotal = todaySales.reduce((acc, s) => acc + s.crateCount, 0) +
    todayShipments.reduce((acc, s) => acc + s.shippedCrates, 0);

  // Total platform monetization accrued
  const totalPlatformFees = sales.reduce(
    (acc, s) => acc + (s.platformFee || s.crateCount * merchantTier.ratePerCrate), 
    0
  ) + shipments.reduce((acc, s) => acc + s.platformFee, 0);

  // Unreturned crates count (only returnable white plastic crates: Large, Medium, Small)
  const unreturnedCratesCount = crates.reduce((sum, c) => {
    const returnableOwed = (c.basinLargeOwed || 0) + (c.crateMediumOwed || 0) + (c.crateSmallOwed || 0);
    return sum + (returnableOwed > 0 ? 1 : 0);
  }, 0);

  const pendingDebtsCount = debts.filter(d => d.remainingDebt > 0).length;

  // Add / Auto-save trader handler
  const handleAddTrader = (name: string, phone?: string, port?: string): TraderProfile => {
    const { updatedTraders, registeredTrader } = registerTraderIfNew(
      traders,
      name,
      phone,
      port || currentPort
    );
    setTraders(updatedTraders);
    return registeredTrader;
  };

  // Add new cargo trading offer/request
  const handleAddCargoListing = (newListing: CargoTradeListing) => {
    setCargoListings(prev => {
      const updated = [newListing, ...prev];
      saveCargoListings(updated);
      return updated;
    });
  };

  // Save guarantee rates
  const handleSaveGuaranteeRates = (newRates: CrateGuaranteeRates) => {
    setGuaranteeRates(newRates);
    saveGuaranteeRates(newRates);
  };

  // Save pre-configured fish to crate mapping
  const handleSaveFishCrateMapping = (newMapping: FishCrateMapping) => {
    setFishCrateMapping(newMapping);
    saveFishCrateMapping(newMapping);
  };

  // Handle new sale recorded in Fast Sales Entry ("الطيار")
  const handleSaveSale = (newSale: SaleEntry) => {
    // 0. Ensure buyer is registered in persistent traders list
    handleAddTrader(newSale.buyerName);

    // 1. Add to sales ledger
    const updatedSales = [newSale, ...sales];
    setSales(updatedSales);
    saveSales(updatedSales);

    // 2. Update buyer crate balance with the 4 authentic Moroccan port crate types
    setCrates(prevCrates => {
      const existing = prevCrates.find(c => c.buyerName === newSale.buyerName);
      let updated: BuyerCrateBalance[];

      const isBasin = newSale.crateType === 'basin_large';
      const isMedium = newSale.crateType === 'crate_medium';
      const isSmall = newSale.crateType === 'crate_small';
      const isStyrofoam = newSale.crateType === 'styrofoam';

      if (existing) {
        updated = prevCrates.map(c => {
          if (c.buyerName === newSale.buyerName) {
            return {
              ...c,
              basinLargeOwed: (c.basinLargeOwed || 0) + (isBasin ? newSale.crateCount : 0),
              basinLargeDelivered: (c.basinLargeDelivered || 0) + (isBasin ? newSale.crateCount : 0),

              crateMediumOwed: (c.crateMediumOwed || 0) + (isMedium ? newSale.crateCount : 0),
              crateMediumDelivered: (c.crateMediumDelivered || 0) + (isMedium ? newSale.crateCount : 0),

              crateSmallOwed: (c.crateSmallOwed || 0) + (isSmall ? newSale.crateCount : 0),
              crateSmallDelivered: (c.crateSmallDelivered || 0) + (isSmall ? newSale.crateCount : 0),

              styrofoamDelivered: (c.styrofoamDelivered || 0) + (isStyrofoam ? newSale.crateCount : 0),

              cautionDepositHeld: c.cautionDepositHeld + newSale.totalCautionAmount,
              lastUpdated: 'اليوم ' + newSale.time
            };
          }
          return c;
        });
      } else {
        updated = [
          ...prevCrates,
          {
            buyerName: newSale.buyerName,
            phone: '+212600000000',
            basinLargeOwed: isBasin ? newSale.crateCount : 0,
            basinLargeDelivered: isBasin ? newSale.crateCount : 0,
            basinLargeReturned: 0,

            crateMediumOwed: isMedium ? newSale.crateCount : 0,
            crateMediumDelivered: isMedium ? newSale.crateCount : 0,
            crateMediumReturned: 0,

            crateSmallOwed: isSmall ? newSale.crateCount : 0,
            crateSmallDelivered: isSmall ? newSale.crateCount : 0,
            crateSmallReturned: 0,

            styrofoamDelivered: isStyrofoam ? newSale.crateCount : 0,
            cautionDepositHeld: newSale.totalCautionAmount,
            lastUpdated: 'اليوم ' + newSale.time
          }
        ];
      }
      saveCrates(updated);
      return updated;
    });

    // 3. If credit or partial, update Debts
    const unpaidAmount = newSale.totalTransactionAmount - newSale.paidAmount;
    if (unpaidAmount > 0) {
      setDebts(prevDebts => {
        const existing = prevDebts.find(d => d.buyerName === newSale.buyerName);
        let updated: DebtRecord[];
        if (existing) {
          updated = prevDebts.map(d => {
            if (d.buyerName === newSale.buyerName) {
              return {
                ...d,
                totalTransactionsAmount: d.totalTransactionsAmount + newSale.totalTransactionAmount,
                totalPaidAmount: d.totalPaidAmount + newSale.paidAmount,
                remainingDebt: d.remainingDebt + unpaidAmount,
                lastTransactionDate: 'اليوم ' + newSale.time
              };
            }
            return d;
          });
        } else {
          updated = [
            ...prevDebts,
            {
              buyerName: newSale.buyerName,
              phone: '+212600000000',
              totalTransactionsAmount: newSale.totalTransactionAmount,
              totalPaidAmount: newSale.paidAmount,
              remainingDebt: unpaidAmount,
              lastTransactionDate: 'اليوم ' + newSale.time
            }
          ];
        }
        saveDebts(updated);
        return updated;
      });
    }
  };

  // Handle returning returnable white plastic crates in CratesView
  const handleReturnCrates = (
    buyerName: string,
    basinReturned: number,
    mediumReturned: number,
    smallReturned: number,
    refundCaution: number
  ) => {
    setCrates(prev => {
      const updated = prev.map(c => {
        if (c.buyerName === buyerName) {
          return {
            ...c,
            basinLargeOwed: Math.max(0, (c.basinLargeOwed || 0) - basinReturned),
            basinLargeReturned: (c.basinLargeReturned || 0) + basinReturned,

            crateMediumOwed: Math.max(0, (c.crateMediumOwed || 0) - mediumReturned),
            crateMediumReturned: (c.crateMediumReturned || 0) + mediumReturned,

            crateSmallOwed: Math.max(0, (c.crateSmallOwed || 0) - smallReturned),
            crateSmallReturned: (c.crateSmallReturned || 0) + smallReturned,

            cautionDepositHeld: Math.max(0, c.cautionDepositHeld - refundCaution),
            lastUpdated: 'تم إرجاع صناديق الآن'
          };
        }
        return c;
      });
      saveCrates(updated);
      return updated;
    });
  };

  // Handle adding new inter-merchant logistics shipment (نظام الشحن والحساب المفتوح)
  const handleAddShipment = (newShipment: LogisticsShipment, sendWhatsApp: boolean) => {
    handleAddTrader(newShipment.buyerName, newShipment.buyerPhone, newShipment.destinationCity);
    
    // 1. Save shipment to logistics state
    setShipments(prev => {
      const updated = [newShipment, ...prev];
      saveLogisticsShipments(updated);
      return updated;
    });

    // 2. Automatically initiate/update Open Account crate balance with the 4 authentic Moroccan types
    setCrates(prevCrates => {
      const existing = prevCrates.find(c => c.buyerName === newShipment.buyerName);
      let updated: BuyerCrateBalance[];

      const isBasin = newShipment.crateType === 'basin_large';
      const isMedium = newShipment.crateType === 'crate_medium';
      const isSmall = newShipment.crateType === 'crate_small';
      const isStyrofoam = newShipment.crateType === 'styrofoam';

      if (existing) {
        updated = prevCrates.map(c => {
          if (c.buyerName === newShipment.buyerName) {
            return {
              ...c,
              basinLargeOwed: (c.basinLargeOwed || 0) + (isBasin ? newShipment.shippedCrates : 0),
              basinLargeDelivered: (c.basinLargeDelivered || 0) + (isBasin ? newShipment.shippedCrates : 0),

              crateMediumOwed: (c.crateMediumOwed || 0) + (isMedium ? newShipment.shippedCrates : 0),
              crateMediumDelivered: (c.crateMediumDelivered || 0) + (isMedium ? newShipment.shippedCrates : 0),

              crateSmallOwed: (c.crateSmallOwed || 0) + (isSmall ? newShipment.shippedCrates : 0),
              crateSmallDelivered: (c.crateSmallDelivered || 0) + (isSmall ? newShipment.shippedCrates : 0),

              styrofoamDelivered: (c.styrofoamDelivered || 0) + (isStyrofoam ? newShipment.shippedCrates : 0),

              cautionDepositHeld: c.cautionDepositHeld + newShipment.totalCautionAmount,
              lastUpdated: 'شحنة لوجستية اليوم'
            };
          }
          return c;
        });
      } else {
        updated = [
          ...prevCrates,
          {
            buyerName: newShipment.buyerName,
            phone: newShipment.buyerPhone || '+212600000000',
            basinLargeOwed: isBasin ? newShipment.shippedCrates : 0,
            basinLargeDelivered: isBasin ? newShipment.shippedCrates : 0,
            basinLargeReturned: 0,
            crateMediumOwed: isMedium ? newShipment.shippedCrates : 0,
            crateMediumDelivered: isMedium ? newShipment.shippedCrates : 0,
            crateMediumReturned: 0,
            crateSmallOwed: isSmall ? newShipment.shippedCrates : 0,
            crateSmallDelivered: isSmall ? newShipment.shippedCrates : 0,
            crateSmallReturned: 0,
            styrofoamDelivered: isStyrofoam ? newShipment.shippedCrates : 0,
            cautionDepositHeld: newShipment.totalCautionAmount,
            lastUpdated: 'شحنة لوجستية اليوم'
          }
        ];
      }
      saveCrates(updated);
      return updated;
    });
  };

  // Fast Crate Return & Automatic Caution Deduction on Shipment ("استرجاع وتصفية الصناديق")
  const handleUpdateShipmentReturn = (
    shipmentId: string,
    returnedCrates: number,
    cashPaid: number,
    notes?: string,
    sendWhatsApp?: boolean
  ) => {
    let affectedBuyer = '';
    let newlyReturnedBasin = 0;
    let newlyReturnedMedium = 0;
    let newlyReturnedSmall = 0;
    let cautionDiff = 0;

    setShipments(prev => {
      const updated = prev.map(s => {
        if (s.id === shipmentId) {
          affectedBuyer = s.buyerName;
          const oldReturned = s.returnedCrates;
          const deltaReturned = Math.max(0, returnedCrates - oldReturned);

          if (s.crateType === 'basin_large') newlyReturnedBasin = deltaReturned;
          else if (s.crateType === 'crate_medium') newlyReturnedMedium = deltaReturned;
          else if (s.crateType === 'crate_small') newlyReturnedSmall = deltaReturned;

          const newRefundedCaution = returnedCrates * s.cautionPerCrate;
          cautionDiff = Math.max(0, newRefundedCaution - s.refundedCautionAmount);

          const unreturnedCount = Math.max(0, s.shippedCrates - returnedCrates);
          const activeCautionDebt = unreturnedCount * s.cautionPerCrate;
          const remainingFishDebt = Math.max(0, s.totalFishValue - cashPaid);
          const netBalance = remainingFishDebt + activeCautionDebt;

          return {
            ...s,
            returnedCrates: returnedCrates,
            refundedCautionAmount: newRefundedCaution,
            unreturnedCrates: unreturnedCount,
            activeCautionDebt: activeCautionDebt,
            cashPaidAmount: cashPaid,
            netBalanceOwed: netBalance,
            status: (unreturnedCount === 0 && netBalance === 0) ? 'settled' : 'partially_returned',
            notes: notes || s.notes,
            lastUpdate: 'تم التحديث وتصفية الصناديق'
          };
        }
        return s;
      });
      saveLogisticsShipments(updated);
      return updated;
    });

    // Sync return with global crate balances
    if (affectedBuyer && (newlyReturnedBasin > 0 || newlyReturnedMedium > 0 || newlyReturnedSmall > 0 || cautionDiff > 0)) {
      handleReturnCrates(
        affectedBuyer,
        newlyReturnedBasin,
        newlyReturnedMedium,
        newlyReturnedSmall,
        cautionDiff
      );
    }
  };

  // Handle recording payment in DebtsView
  const handleRecordPayment = (buyerName: string, amount: number) => {
    setDebts(prev => {
      const updated = prev.map(d => {
        if (d.buyerName === buyerName) {
          const newDebt = Math.max(0, d.remainingDebt - amount);
          return {
            ...d,
            totalPaidAmount: d.totalPaidAmount + amount,
            remainingDebt: newDebt,
            lastTransactionDate: 'دفعة اليوم'
          };
        }
        return d;
      });
      saveDebts(updated);
      return updated;
    });
  };

  // Handle cold storage withdraw
  const handleWithdrawColdStorage = (id: string, cratesToWithdraw: number) => {
    setStorageItems(prev => {
      const updated = prev
        .map(item => {
          if (item.id === id) {
            const remaining = item.crateCount - cratesToWithdraw;
            return remaining > 0 ? { ...item, crateCount: remaining } : null;
          }
          return item;
        })
        .filter(Boolean) as ColdStorageItem[];
      saveColdStorage(updated);
      return updated;
    });
  };

  // Handle add new batch to cold storage
  const handleAddNewBatch = (newItem: Omit<ColdStorageItem, 'id' | 'daysStored'>) => {
    setStorageItems(prev => {
      const fullItem: ColdStorageItem = {
        ...newItem,
        id: `CS-${Date.now().toString().slice(-4)}`,
        daysStored: 0
      };
      const updated = [fullItem, ...prev];
      saveColdStorage(updated);
      return updated;
    });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-['Cairo',sans-serif] selection:bg-cyan-500 selection:text-slate-950">
      {/* Top Application Header */}
      <Header
        currentPort={currentPort}
        onPortChange={setCurrentPort}
        dailyCrates={dailyCratesTotal}
        totalSellerVolume={totalSellerVolume}
        merchantTier={merchantTier}
        trialDaysLeft={trialDaysLeft}
        onOpenSettings={() => setIsSettingsModalOpen(true)}
      />

      {/* Main Tab View Canvas */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-2 sm:p-4">
        {activeTab === 'fast_entry' && (
          <FastSalesView
            onSaveSale={handleSaveSale}
            sellerName={sellerName}
            traders={traders}
            onAddTrader={handleAddTrader}
            guaranteeRates={guaranteeRates}
            fishCrateMapping={fishCrateMapping}
            merchantTier={merchantTier}
            onOpenSettings={() => setIsSettingsModalOpen(true)}
          />
        )}

        {activeTab === 'crates' && (
          <CratesView
            crates={crates}
            onReturnCrates={handleReturnCrates}
            guaranteeRates={guaranteeRates}
            merchantTier={merchantTier}
            totalSellerVolume={totalSellerVolume}
            onOpenSettings={() => setIsSettingsModalOpen(true)}
            totalPlatformFees={totalPlatformFees}
            shipments={shipments}
            onAddShipment={handleAddShipment}
            onUpdateShipmentReturn={handleUpdateShipmentReturn}
            sellerName={sellerName}
            traders={traders}
            onAddTrader={handleAddTrader}
            currentPort={currentPort}
          />
        )}

        {activeTab === 'cold_storage' && (
          <ColdStorageView
            storageItems={storageItems}
            onWithdrawItem={handleWithdrawColdStorage}
            onAddNewBatch={handleAddNewBatch}
          />
        )}

        {activeTab === 'debts' && (
          <DebtsView
            debts={debts}
            onRecordPayment={handleRecordPayment}
            sellerName={sellerName}
          />
        )}

        {activeTab === 'market' && (
          <MarketView 
            currentMerchantName={sellerName}
            cargoListings={cargoListings}
            onAddCargoListing={handleAddCargoListing}
          />
        )}

        {activeTab === 'reports' && (
          <ReportsView
            sales={sales}
            sellerName={sellerName}
            trialDaysLeft={trialDaysLeft}
            traders={traders}
            debts={debts}
            crates={crates}
          />
        )}
      </main>

      {/* Floating Microphone Button for Voice Assistant ("محاسب مالي") */}
      <div className="fixed bottom-20 left-4 z-40">
        <button
          type="button"
          onClick={() => {
            soundEffects.playClick();
            setIsVoiceModalOpen(true);
          }}
          className="group relative flex items-center gap-2 px-3.5 py-2.5 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 active:scale-95 text-slate-950 shadow-xl shadow-cyan-500/25 border border-cyan-300/40 transition-all cursor-pointer"
          title="محاسب مالي - استشارة صوتية"
        >
          <div className="relative">
            <Mic className="w-5 h-5 text-slate-950 stroke-[2.5]" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 border border-slate-950 animate-ping" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 border border-slate-950" />
          </div>
          <span className="text-xs font-black tracking-tight text-slate-950">
            محاسب مالي
          </span>
        </button>
      </div>

      {/* Voice Assistant Bottom Sheet Modal */}
      <VoiceAssistantModal
        isOpen={isVoiceModalOpen}
        onClose={() => setIsVoiceModalOpen(false)}
        sales={sales}
        debts={debts}
        crateBalances={crates}
        merchantTierRate={merchantTier.ratePerCrate}
      />

      {/* Global Settings Modal for Crate Guarantee Rates & Platform Commission Tiers */}
      <CrateSettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        rates={guaranteeRates}
        onSaveRates={handleSaveGuaranteeRates}
        fishCrateMapping={fishCrateMapping}
        onSaveFishCrateMapping={handleSaveFishCrateMapping}
        sellerVolume={totalSellerVolume}
        currentTier={merchantTier}
      />

      {/* Bottom Navigation Bar */}
      <BottomNav
        activeTab={activeTab}
        onTabChange={setActiveTab}
        pendingDebtsCount={pendingDebtsCount}
        unreturnedCratesCount={unreturnedCratesCount}
      />
    </div>
  );
}

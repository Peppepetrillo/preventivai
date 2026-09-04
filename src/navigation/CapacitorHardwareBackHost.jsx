import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { App as CapApp } from "@capacitor/app";

import {
  isBottomNavRoot,
  richiedeNavigazioneIndietro
} from "../app/navigationConfig";
import {
  eseguiNavigazioneIndietro,
  provaChiudereOverlayNavigazione
} from "./navigateBack";

/**
 * Hardware back Android → stesso comportamento di PageBackLink / edge swipe.
 * Su root BottomNav senza history: exitApp.
 */
export default function CapacitorHardwareBackHost() {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    let handle = null;

    async function registra() {
      try {
        handle = await CapApp.addListener("backButton", ({ canGoBack }) => {
          if (provaChiudereOverlayNavigazione()) {
            return;
          }
          if (richiedeNavigazioneIndietro(location.pathname)) {
            eseguiNavigazioneIndietro(navigate, location.pathname);
            return;
          }
          if (isBottomNavRoot(location.pathname)) {
            if (!canGoBack) {
              CapApp.exitApp();
            }
            return;
          }
          eseguiNavigazioneIndietro(navigate, location.pathname);
        });
      } catch {
        // Web / plugin assente
      }
    }

    registra();

    return () => {
      handle?.remove?.();
    };
  }, [location.pathname, navigate]);

  return null;
}

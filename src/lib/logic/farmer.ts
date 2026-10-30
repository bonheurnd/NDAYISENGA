import type { Farmer, Plot } from '../../types/index.ts';

export interface FarmerValidationResult {
  isValid: boolean;
  errorRw?: string;
  errorEn?: string;
}

export function validateFarmerInput(data: {
  fullName?: string;
  phone?: string;
  nationalId?: string;
}): FarmerValidationResult {
  if (!data.fullName || !data.fullName.trim()) {
    return {
      isValid: false,
      errorRw: 'Izina ry\'umuhinzi ni ngombwa.',
      errorEn: 'Farmer full name is required.',
    };
  }

  const cleanedPhone = (data.phone || '').trim();
  if (!cleanedPhone || cleanedPhone.length < 10) {
    return {
      isValid: false,
      errorRw: 'Numero ya telefone ntiyuzuye.',
      errorEn: 'Valid phone number is required (at least 10 digits).',
    };
  }

  if (data.nationalId && data.nationalId.trim()) {
    const cleanedNid = data.nationalId.trim();
    if (!/^\d{16}$/.test(cleanedNid)) {
      return {
        isValid: false,
        errorRw: 'Indangamuntu igomba kuba igizwe n\'imibare 16.',
        errorEn: 'Rwandan National ID must be exactly 16 digits.',
      };
    }
  }

  return { isValid: true };
}

export function checkDuplicateFarmer(
  data: { phone: string; nationalId?: string; currentFarmerId?: string },
  existingFarmers: Farmer[]
): FarmerValidationResult {
  const cleanedPhone = data.phone.trim();
  const phoneConflict = existingFarmers.find(
    (f) => f.id !== data.currentFarmerId && f.phone === cleanedPhone
  );
  if (phoneConflict) {
    return {
      isValid: false,
      errorRw: `Numero ya telefone ${cleanedPhone} isanzwe yanditswe ku muhinzi ${phoneConflict.fullName}.`,
      errorEn: `Phone number ${cleanedPhone} is already registered to ${phoneConflict.fullName}.`,
    };
  }

  if (data.nationalId && data.nationalId.trim()) {
    const cleanedNid = data.nationalId.trim();
    const nidConflict = existingFarmers.find(
      (f) => f.id !== data.currentFarmerId && f.nationalId === cleanedNid
    );
    if (nidConflict) {
      return {
        isValid: false,
        errorRw: `Indangamuntu ${cleanedNid} isanzwe yanditswe ku muhinzi ${nidConflict.fullName}.`,
        errorEn: `National ID ${cleanedNid} is already registered to ${nidConflict.fullName}.`,
      };
    }
  }

  return { isValid: true };
}

export function syncPlotAssignments(
  farmerId: string,
  farmerName: string,
  newPlotIds: string[],
  existingPlots: Plot[]
): Plot[] {
  return existingPlots.map((plot) => {
    if (newPlotIds.includes(plot.id)) {
      return {
        ...plot,
        currentFarmerId: farmerId,
        currentFarmerName: farmerName,
      };
    } else if (plot.currentFarmerId === farmerId) {
      return {
        ...plot,
        currentFarmerId: undefined,
        currentFarmerName: undefined,
      };
    }
    return plot;
  });
}

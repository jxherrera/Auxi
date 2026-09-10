export const formatCurrency = (amount: number | undefined | null): string => {
  if (amount === undefined || amount === null || isNaN(amount)) return '$0.00';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

export const formatNumber = (val: number | undefined | null, decimals: number = 0): string => {
  if (val === undefined || val === null || isNaN(val)) return '0';
  return new Intl.NumberFormat('es-EC', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(val);
};

export const formatDate = (dateStr: string | undefined | null): string => {
  if (!dateStr) return '-';
  try {
    const [year, month, day] = dateStr.split('-');
    if (year && month && day) {
      return `${day}/${month}/${year}`;
    }
    return dateStr;
  } catch {
    return dateStr || '-';
  }
};

export const formatDateLong = (dateStr: string | undefined | null): string => {
  if (!dateStr) return '-';
  try {
    const [year, month, day] = dateStr.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return new Intl.DateTimeFormat('es-ES', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(date);
  } catch {
    return dateStr || '-';
  }
};

export const formatArea = (m2: number | undefined | null): string => {
  if (!m2 || isNaN(m2)) return '0 m²';
  const hectares = (m2 / 10000).toFixed(2);
  return `${formatNumber(m2)} m² (${hectares} ha)`;
};

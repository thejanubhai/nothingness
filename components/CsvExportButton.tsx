'use client';

import { Download } from 'lucide-react';
import { toast } from 'sonner';

export default function CsvExportButton({ 
  data, 
  filename,
  label = "Export CSV" 
}: { 
  data: any[], 
  filename: string,
  label?: string
}) {
  const handleExport = () => {
    if (!data || data.length === 0) {
      toast.error('No data to export');
      return;
    }

    try {
      // Get headers
      const headers = Object.keys(data[0]);
      
      // Convert data to CSV format
      const csvRows = [];
      csvRows.push(headers.join(',')); // Add headers
      
      for (const row of data) {
        const values = headers.map(header => {
          const val = row[header];
          // Handle nested objects by stringifying or extracting specific values
          const escaped = typeof val === 'object' && val !== null 
            ? JSON.stringify(val).replace(/"/g, '""') 
            : String(val).replace(/"/g, '""');
          return `"${escaped}"`;
        });
        csvRows.push(values.join(','));
      }

      const csvContent = csvRows.join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success('Export downloaded successfully');
    } catch (e) {
      console.error(e);
      toast.error('Failed to export data');
    }
  };

  return (
    <button 
      onClick={handleExport}
      className="flex items-center gap-2 bg-white/5 border border-white/10 hover:bg-white/10 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
    >
      <Download className="w-4 h-4 text-accent-gold" />
      {label}
    </button>
  );
}

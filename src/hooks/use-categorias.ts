import { useCallback, useEffect, useState } from 'react';

import { supabase } from '@/lib/supabase';
import type { Categoria } from '@/types/database';

/** Categorias padrão do sistema + as customizadas do usuário (RLS já filtra). */
export function useCategorias() {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(true);

  const carregar = useCallback(async () => {
    const { data } = await supabase.from('categorias').select('*').order('nome');
    setCategorias(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  return { categorias, loading, recarregar: carregar };
}

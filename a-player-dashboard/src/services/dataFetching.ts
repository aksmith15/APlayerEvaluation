import { supabase } from './supabase';
import type { WeightedEvaluationScore, Person } from '../types/database';
import type { Employee, Quarter } from '../types/evaluation';

// Data fetching utilities

export const fetchEmployees = async (): Promise<Employee[]> => {
  try {
    console.log('Fetching employees from people table...');
    
    // Get all active employees (simplified version)
    const { data: people, error: peopleError } = await supabase
      .from('people')
      .select('*')
      .eq('active', true)
      .order('name');

    if (peopleError) {
      console.error('Error fetching people:', peopleError);
      throw peopleError;
    }

    if (!people || people.length === 0) {
      console.warn('No people found in database');
      return [];
    }

    console.log(`Found ${people.length} people in database`);

    // Convert to Employee format with basic data
    const employees: Employee[] = people.map((person) => ({
      ...person,
      overallScore: undefined, // We'll add score calculation later
      latestQuarter: undefined
    }));

    return employees;
  } catch (error) {
    console.error('Error fetching employees:', error);
    throw error;
  }
};

export const fetchEmployeeData = async (employeeId: string): Promise<Person | null> => {
  try {
    const { data, error } = await supabase
      .from('people')
      .select('*')
      .eq('id', employeeId)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching employee data:', error);
    throw error;
  }
};

export const fetchQuarters = async (): Promise<Quarter[]> => {
  try {
    const { data, error } = await supabase
      .from('evaluation_cycles')
      .select('*')
      .order('start_date', { ascending: false });

    if (error) throw error;

    return data.map(cycle => ({
      id: cycle.id,
      name: cycle.name,
      startDate: cycle.start_date,
      endDate: cycle.end_date
    }));
  } catch (error) {
    console.error('Error fetching quarters:', error);
    throw error;
  }
};

export const fetchEvaluationScores = async (
  employeeId: string,
  quarterId?: string
): Promise<WeightedEvaluationScore[]> => {
  try {
    let query = supabase
      .from('weighted_evaluation_scores')
      .select('*')
      .eq('evaluatee_id', employeeId);

    if (quarterId) {
      query = query.eq('quarter_id', quarterId);
    }

    const { data, error } = await query.order('attribute_name');

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching evaluation scores:', error);
    throw error;
  }
};

export const fetchAppConfig = async (key: string): Promise<string | null> => {
  try {
    const { data, error } = await supabase
      .from('app_config')
      .select('value')
      .eq('key', key)
      .single();

    if (error) throw error;
    return data?.value || null;
  } catch (error) {
    console.error('Error fetching app config:', error);
    throw error;
  }
}; 